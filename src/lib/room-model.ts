import type {
  BuildingName,
  GuestStatus,
  PriorityLevel,
  RoomStatus,
  WingName,
} from "@/types/operations";

export type { BuildingName };

/**
 * The room_status enum stored in the database. These six labels are the only
 * values Postgres will accept for `rooms.status` — see the `public.room_status`
 * enum in supabase/migrations. Never write a string into that column that did
 * not come from this union.
 */
export type DbRoomStatus =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "out_of_order" | "reserved";

/** Display order for the status filters and counters on the boards. */
export const DB_STATUS_ORDER: DbRoomStatus[] = [
  "vacant_clean",
  "vacant_dirty",
  "occupied",
  "occupied_dnd",
  "reserved",
  "out_of_order",
];

/** Shape returned by `rooms_board()` / `select` on `rooms`. */
export type DbRoomRow = {
  id: string;
  number: string;
  floor: number;
  bed_type?: string | null;
  status: DbRoomStatus;
  guest_name?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  original_check_out?: string | null;
  notes?: string | null;
  dnd?: boolean | null;
  extended_stay?: boolean | null;
  assigned_name?: string | null;
  wing?: string | null;
  building?: BuildingName | null;
  side?: string | null;
  guest_status?: string | null;
  hk_stage?: string | null;
  priority?: string | null;
  linen_change?: boolean | null;
  updated_at?: string | null;
};

/**
 * Actual property building based on physical layout:
 * - Main Building: rooms 108-117 and 208-217, plus upstairs rooms 200-209;
 *   also contains lobby, breakfast area, kitchen, GM office, security, and the pool
 * - Building 2: rooms 118-135 and 218-235; contains laundry / guest laundry facility
 * - Building 3: rooms 136-163 and 236-265
 */
export function buildingForRoom(number: string): BuildingName {
  const value = Number(number);
  if (!Number.isFinite(value)) return "Main Building";

  if (value < 200) {
    if (value >= 100 && value <= 117) return "Main Building";
    if (value >= 118 && value <= 135) return "Building 2";
    if (value >= 136 && value <= 165) return "Building 3";
  } else {
    if (value >= 200 && value <= 217) return "Main Building";
    if (value >= 218 && value <= 235) return "Building 2";
    if (value >= 236 && value <= 265) return "Building 3";
  }
  return "Main Building";
}

/**
 * Determine if DND is active as an independent boolean/flag.
 */
export function isDndActive(room: {
  dnd?: boolean | null;
  status?: DbRoomStatus | string | null;
}): boolean {
  return Boolean(room.dnd) || room.status === "occupied_dnd" || room.status === "DND";
}

/**
 * Determine if Extended Stay is active (either boolean flag or check_out > original_check_out).
 */
export function isExtendedStay(room: {
  extended_stay?: boolean | null;
  check_out?: string | null;
  original_check_out?: string | null;
}): boolean {
  if (room.extended_stay === true) return true;
  if (!room.check_out || !room.original_check_out) return false;
  return room.check_out > room.original_check_out;
}

/** True when a room occupies the vertical physical wing on the site plan. */
function isVerticalWing(number: string) {
  const value = Number(number);
  if (!Number.isFinite(value)) return false;
  return value < 200 ? value >= 108 && value <= 135 : value >= 208 && value <= 235;
}

/** Wing derived from the physical layout when the column is not yet set. */
export function wingForRoom(number: string): WingName {
  return isVerticalWing(number) ? "West Wing" : "North Wing";
}

export function sideForRoom(number: string): string {
  const value = Number(number);
  if (isVerticalWing(number)) {
    return value % 2 === 0 ? "Courtyard side" : "Parking side";
  }
  return value % 2 === 0 ? "Pool side" : "Rear side";
}

/**
 * Housekeeping state. `hk_stage` captures the two transient stages the enum
 * has no room for (In Progress / Inspected); everything else derives from the
 * stored status.
 */
export function toRoomStatus(row: DbRoomRow): RoomStatus {
  if (row.hk_stage === "in_progress") return "In Progress";
  if (row.hk_stage === "inspected") return "Inspected";
  if (row.status === "out_of_order") return "Maintenance";
  if (isDndActive(row)) return "DND";
  if (isExtendedStay(row)) return "Stayover";
  if (row.status === "vacant_clean") return "Clean";
  if (row.status === "vacant_dirty") return "Dirty";
  return row.status === "occupied" ? "Dirty" : "Clean";
}

export function toGuestStatus(row: DbRoomRow, today = new Date()): GuestStatus {
  const stored = row.guest_status as GuestStatus | null | undefined;
  if (stored) return stored;
  if (row.status === "out_of_order") return "Out of Order";
  if (row.status === "reserved") return "Expected Arrival";
  if (row.extended_stay) return "Stayover";
  if (row.status === "occupied" || row.status === "occupied_dnd") {
    const iso = today.toISOString().slice(0, 10);
    return row.check_out === iso ? "Checkout" : "Occupied";
  }
  return "Vacant";
}

/**
 * Write-side mapping: the DB columns to set when a board picks a room status.
 * `null` stage clears the transient housekeeping stage.
 */
export function fromRoomStatus(next: RoomStatus): {
  status?: DbRoomStatus;
  hk_stage: string | null;
  dnd?: boolean;
} {
  switch (next) {
    case "Clean":
      return { status: "vacant_clean", hk_stage: null };
    case "Dirty":
      return { status: "vacant_dirty", hk_stage: null };
    case "In Progress":
      return { hk_stage: "in_progress" };
    case "Inspected":
      return { status: "vacant_clean", hk_stage: "inspected" };
    case "DND":
      return { status: "occupied_dnd", hk_stage: null, dnd: true };
    case "Maintenance":
      return { status: "out_of_order", hk_stage: null };
    case "Stayover":
      return { status: "occupied", hk_stage: null };
  }
}

/**
 * Status vocabulary exposed to the ops assistant and the MCP tools. It is a
 * deliberately plain-English surface for a language model, so it does NOT match
 * the database enum — `fromAssistantRoomStatus` is the only sanctioned bridge.
 */
export const ASSISTANT_ROOM_STATUSES = [
  "clean",
  "dirty",
  "in_progress",
  "inspected",
  "out_of_order",
  "occupied",
  "vacant",
] as const;

export type AssistantRoomStatus = (typeof ASSISTANT_ROOM_STATUSES)[number];

/**
 * `vacant` maps to Dirty rather than Clean on purpose: a room reported vacant
 * has almost always just been checked out of, and re-cleaning a clean room
 * costs labour while skipping a dirty one puts a guest in it.
 */
const ASSISTANT_TO_ROOM_STATUS: Record<AssistantRoomStatus, RoomStatus> = {
  clean: "Clean",
  dirty: "Dirty",
  in_progress: "In Progress",
  inspected: "Inspected",
  out_of_order: "Maintenance",
  occupied: "Stayover",
  vacant: "Dirty",
};

/**
 * Translate an assistant-supplied status into the columns to write. Returns the
 * same shape as `fromRoomStatus`, so `status` is absent for stages that only
 * move `hk_stage` and must not clobber the stored status.
 */
export function fromAssistantRoomStatus(status: AssistantRoomStatus): {
  status?: DbRoomStatus;
  hk_stage: string | null;
  dnd?: boolean;
} {
  return fromRoomStatus(ASSISTANT_TO_ROOM_STATUS[status]);
}

/**
 * Presentation tokens keyed by the database status. The boards read the raw
 * `rooms.status` column, so these — not the domain-status maps — are what the
 * front desk and housekeeping views render from.
 */
export const DB_STATUS_LABEL: Record<DbRoomStatus, string> = {
  vacant_clean: "Vacant clean",
  vacant_dirty: "Vacant dirty",
  occupied: "Occupied",
  occupied_dnd: "Occupied / DND",
  reserved: "Reserved / arriving",
  out_of_order: "Out of order",
};

/** Card fill for the front-desk board, which is clickable and so has a hover state. */
export const DB_STATUS_CARD: Record<DbRoomStatus, string> = {
  vacant_clean: "border-status-clean/55 bg-status-clean/12 hover:bg-status-clean/20",
  vacant_dirty: "border-status-dirty/55 bg-status-dirty/12 hover:bg-status-dirty/20",
  occupied: "border-status-occupied/55 bg-status-occupied/14 hover:bg-status-occupied/22",
  occupied_dnd: "border-status-dnd/55 bg-status-dnd/14 hover:bg-status-dnd/22",
  reserved: "border-status-reserved/55 bg-status-reserved/12 hover:bg-status-reserved/20",
  out_of_order: "border-status-ooo/55 bg-status-ooo/12 hover:bg-status-ooo/20",
};

/**
 * Card fill for the housekeeping board. Identical to `DB_STATUS_CARD` except
 * the two states a housekeeper must act on — dirty and DND — carry a heavier
 * fill so they read first on a phone in a corridor.
 */
export const DB_STATUS_CARD_STRONG: Record<DbRoomStatus, string> = {
  vacant_clean: "border-status-clean/55 bg-status-clean/12",
  vacant_dirty: "border-status-dirty/70 bg-status-dirty/20",
  occupied: "border-status-occupied/55 bg-status-occupied/14",
  occupied_dnd: "border-status-dnd/70 bg-status-dnd/20",
  reserved: "border-status-reserved/55 bg-status-reserved/12",
  out_of_order: "border-status-ooo/55 bg-status-ooo/12",
};

export const DB_STATUS_DOT: Record<DbRoomStatus, string> = {
  vacant_clean: "bg-status-clean",
  vacant_dirty: "bg-status-dirty",
  occupied: "bg-status-occupied",
  occupied_dnd: "bg-status-dnd",
  reserved: "bg-status-reserved",
  out_of_order: "bg-status-ooo",
};

export const DB_STATUS_TEXT: Record<DbRoomStatus, string> = {
  vacant_clean: "text-status-clean",
  vacant_dirty: "text-status-dirty",
  occupied: "text-status-occupied",
  occupied_dnd: "text-status-dnd",
  reserved: "text-status-reserved",
  out_of_order: "text-status-ooo",
};

export const DB_STATUS_PILL: Record<DbRoomStatus, string> = {
  vacant_clean: "border-status-clean/40 bg-status-clean/15 text-status-clean",
  vacant_dirty: "border-status-dirty/45 bg-status-dirty/15 text-status-dirty",
  occupied: "border-status-occupied/40 bg-status-occupied/15 text-status-occupied",
  occupied_dnd: "border-status-dnd/45 bg-status-dnd/15 text-status-dnd",
  reserved: "border-status-reserved/40 bg-status-reserved/15 text-status-reserved",
  out_of_order: "border-status-ooo/45 bg-status-ooo/15 text-status-ooo",
};

/** Labels for the transient housekeeping stages stored in `hk_stage`. */
export const HK_STAGE_LABEL: Record<string, string> = {
  in_progress: "In progress",
  inspected: "Inspected",
};

export const PRIORITY_BADGE: Record<PriorityLevel, string> = {
  Normal: "bg-transparent text-cream/45",
  High: "bg-amber/20 text-amber",
  VIP: "bg-amber text-ink",
};

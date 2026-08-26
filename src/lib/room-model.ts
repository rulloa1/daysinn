import type { GuestStatus, PriorityLevel, Room, RoomStatus, WingName } from "@/types/operations";

/** The room_status enum stored in the database. */
export type DbRoomStatus =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "out_of_order" | "reserved";

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
  notes?: string | null;
  dnd?: boolean | null;
  extended_stay?: boolean | null;
  assigned_name?: string | null;
  wing?: string | null;
  side?: string | null;
  guest_status?: string | null;
  hk_stage?: string | null;
  priority?: string | null;
  linen_change?: boolean | null;
  updated_at?: string | null;
};

/** True when a room occupies the vertical physical wing on the site plan. */
function isVerticalWing(number: string) {
  const value = Number(number);
  if (!Number.isFinite(value)) return false;
  return value < 200 ? value >= 110 && value <= 135 : value >= 210 && value <= 235;
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
  if (row.status === "occupied_dnd" || row.dnd) return "DND";
  if (row.extended_stay) return "Stayover";
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

export function toRoom(row: DbRoomRow): Room {
  return {
    id: row.id,
    number: row.number,
    wing: ((row.wing as WingName | null) ?? wingForRoom(row.number)) as WingName,
    floor: (row.floor === 2 ? 2 : 1) as 1 | 2,
    side: row.side ?? sideForRoom(row.number),
    type: row.bed_type ?? "Standard",
    status: toRoomStatus(row),
    guest_status: toGuestStatus(row),
    assigned_to: row.assigned_name ?? "",
    priority: ((row.priority as PriorityLevel | null) ?? "Normal") as PriorityLevel,
    linen_change: Boolean(row.linen_change),
    notes: row.notes ?? "",
    last_updated: row.updated_at ?? "",
  };
}

/** Tailwind classes keyed by the domain status, reusing the status tokens. */
export const ROOM_STATUS_CARD: Record<RoomStatus, string> = {
  Clean: "border-status-clean/55 bg-status-clean/12",
  Dirty: "border-status-dirty/60 bg-status-dirty/16",
  "In Progress": "border-amber/60 bg-amber/15",
  Inspected: "border-status-clean/70 bg-status-clean/20",
  DND: "border-status-dnd/60 bg-status-dnd/16",
  Maintenance: "border-status-ooo/60 bg-status-ooo/14",
  Stayover: "border-status-occupied/60 bg-status-occupied/14",
};

export const ROOM_STATUS_TEXT: Record<RoomStatus, string> = {
  Clean: "text-status-clean",
  Dirty: "text-status-dirty",
  "In Progress": "text-amber",
  Inspected: "text-status-clean",
  DND: "text-status-dnd",
  Maintenance: "text-status-ooo",
  Stayover: "text-status-occupied",
};

export const PRIORITY_BADGE: Record<PriorityLevel, string> = {
  Normal: "bg-transparent text-cream/45",
  High: "bg-amber/20 text-amber",
  VIP: "bg-amber text-ink",
};

import type { BuildingName } from "@/types/operations";
import type { DbRoomStatus } from "@/lib/room-model";

/** A room as the housekeeping board reads it from the `rooms` table. */
export type RoomRow = {
  id: string;
  number: string;
  floor: number;
  bed_type?: string | null;
  status: DbRoomStatus;
  guest_name: string | null;
  check_out: string | null;
  original_check_out?: string | null;
  notes: string | null;
  dnd: boolean;
  extended_stay: boolean;
  updated_at: string;
  assigned_staff_id: string | null;
  assigned_name: string | null;
  hk_stage: string | null;
  priority: string | null;
  linen_change: boolean | null;
};

/** An open guest/maintenance request shown against a room. */
export type IssueRow = {
  id: string;
  room: string;
  type: string;
  details: string | null;
  status: string;
  created_at: string;
  started_at: string | null;
  started_by_name: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
};

export type BoardFilter = "all" | "dirty" | "mine";
export type BoardView = "grid" | "map" | "runner";

export const BUILDING_META: Record<BuildingName, { label: string; description: string }> = {
  "Main Building": {
    label: "Main Building",
    description: "Rooms 108–117 & 200–217 · Lobby, Pool & Front Wing",
  },
  "Building 2": {
    label: "Building 2",
    description: "Rooms 118–135 & 218–235 · Laundry & Facilities",
  },
  "Building 3": {
    label: "Building 3",
    description: "Rooms 136–163 & 236–265 · Courtyard & Rear Wing",
  },
};

/** One-tap cleaning states a housekeeper can set on their own rooms. */
export const QUICK_STATUS: { status: DbRoomStatus; label: string; className: string }[] = [
  { status: "vacant_clean", label: "Clean", className: "bg-status-clean text-ink" },
  { status: "vacant_dirty", label: "Dirty", className: "bg-status-dirty text-ink" },
  { status: "occupied_dnd", label: "DND", className: "bg-status-dnd text-ink" },
  {
    status: "out_of_order",
    label: "Out of order",
    className: "border border-status-ooo/70 text-status-ooo",
  },
];

/** Housekeeping priority: what needs a cart first. */
export const CLEANING_PRIORITY: DbRoomStatus[] = [
  "vacant_dirty",
  "occupied",
  "occupied_dnd",
  "reserved",
  "vacant_clean",
  "out_of_order",
];

export const CLEANING_STAGES: { value: string | null; label: string }[] = [
  { value: null, label: "None" },
  { value: "in_progress", label: "In progress" },
  { value: "inspected", label: "Inspected" },
];

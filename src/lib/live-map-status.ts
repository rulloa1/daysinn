/**
 * Palette and wording for the live property map (/live-room-status).
 *
 * Solid pill colours plus the softer chip/label pair each status uses in the
 * side panels, kept in one place so the map, counts, legend and feed match.
 */
export type LiveStatus =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "reserved" | "out_of_order";

export type LiveStatusMeta = {
  /** Long label used in the legend and the selected-room chip. */
  label: string;
  /** Compact label used on count cards and the attention list. */
  short: string;
  /** Text/dot colour. */
  color: string;
  /** Soft background used behind the status chip. */
  chip: string;
  /** Solid map-pill background. */
  pill: string;
  /** Readable ink on top of the pill. */
  pillFg: string;
  /** One-line reason the room needs attention. */
  note: string;
};

export const LIVE_STATUS_META: Record<LiveStatus, LiveStatusMeta> = {
  vacant_clean: {
    label: "Ready",
    short: "Ready",
    color: "#0F7B4F",
    chip: "#E7F4EE",
    pill: "#10A366",
    pillFg: "#04250F",
    note: "Inspected and ready to sell",
  },
  vacant_dirty: {
    label: "Turn",
    short: "Turn",
    color: "#B45309",
    chip: "#FBF0E2",
    pill: "#F4C24A",
    pillFg: "#3A2404",
    note: "Awaiting housekeeping turn",
  },
  occupied: {
    label: "In house",
    short: "In house",
    color: "#0065AB",
    chip: "#E5F0F9",
    pill: "#3E9BDC",
    pillFg: "#03243B",
    note: "Guest in house",
  },
  occupied_dnd: {
    label: "DND",
    short: "DND",
    color: "#7C3AED",
    chip: "#F1EAFC",
    pill: "#A97BEE",
    pillFg: "#20073F",
    note: "Do not disturb — service deferred",
  },
  reserved: {
    label: "Arriving",
    short: "Arriving",
    color: "#0E7490",
    chip: "#E4F2F5",
    pill: "#4ECBD9",
    pillFg: "#04303A",
    note: "Held for an arrival today",
  },
  out_of_order: {
    label: "Blocked",
    short: "Blocked",
    color: "#B91C1C",
    chip: "#FBEAE9",
    pill: "#EF7B6B",
    pillFg: "#3B0B06",
    note: "Out of order — maintenance",
  },
};

export const LIVE_STATUS_ORDER: readonly LiveStatus[] = [
  "vacant_clean",
  "vacant_dirty",
  "occupied",
  "occupied_dnd",
  "reserved",
  "out_of_order",
];

/** Statuses the front desk has to act on, in the order they should surface. */
export const LIVE_ATTENTION: ReadonlySet<LiveStatus> = new Set<LiveStatus>([
  "out_of_order",
  "vacant_dirty",
  "reserved",
  "occupied_dnd",
]);

/** Short past-tense wording for the live feed. */
export const LIVE_EVENT_TEXT: Record<LiveStatus, string> = {
  vacant_clean: "marked clean",
  vacant_dirty: "checked out",
  occupied: "checked in",
  occupied_dnd: "set to do-not-disturb",
  reserved: "assigned to an arrival",
  out_of_order: "blocked for maintenance",
};

/**
 * Palette and wording for the live property map (/live-room-status).
 *
 * Solid pill colours plus the softer chip/label pair each status uses in the
 * side panels, kept in one place so the map, counts, legend and feed match.
 */
export type LiveStatus =
  | "vacant_clean"
  | "vacant_dirty"
  | "occupied"
  | "occupied_dnd"
  | "reserved"
  | "out_of_order";

export type LiveStatusMeta = {
  /** Long label used in the legend and the selected-room chip. */
  label: string;
  /** Plain-English wording used in the property-map legend. */
  mapLabel: string;
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
    mapLabel: "Vacant clean",
    label: "Ready",
    short: "Ready",
    color: "#0F7B4F",
    chip: "#E7F4EE",
    pill: "#16A34A",
    pillFg: "#FFFFFF",
    note: "Inspected and ready to sell",
  },
  vacant_dirty: {
    mapLabel: "Vacant dirty",
    label: "Turn",
    short: "Turn",
    color: "#B45309",
    chip: "#FBF0E2",
    pill: "#F5A524",
    pillFg: "#3A2404",
    note: "Awaiting housekeeping turn",
  },
  occupied: {
    mapLabel: "Occupied",
    label: "In house",
    short: "In house",
    color: "#0065AB",
    chip: "#E5F0F9",
    pill: "#2E7DD1",
    pillFg: "#FFFFFF",
    note: "Guest in house",
  },
  occupied_dnd: {
    mapLabel: "Occupied / DND",
    label: "DND",
    short: "DND",
    color: "#7C3AED",
    chip: "#F1EAFC",
    pill: "#8B5CF6",
    pillFg: "#FFFFFF",
    note: "Do not disturb — service deferred",
  },
  reserved: {
    mapLabel: "Reserved / arriving",
    label: "Arriving",
    short: "Arriving",
    color: "#0E7490",
    chip: "#E4F2F5",
    pill: "#14B8A6",
    pillFg: "#04303A",
    note: "Held for an arrival today",
  },
  out_of_order: {
    mapLabel: "Out of order",
    label: "Blocked",
    short: "Blocked",
    color: "#B91C1C",
    chip: "#FBEAE9",
    pill: "#EF4444",
    pillFg: "#FFFFFF",
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

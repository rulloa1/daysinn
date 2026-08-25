/**
 * Physical layout of Days Inn Wildwood (551 FL-44).
 *
 * The map is an L-shaped compound with a lobby/service block, a horizontal
 * guest wing, a vertical guest wing, a central courtyard, and perimeter parking.
 * The room ranges below reflect the approved property-map convention.
 */

export type FloorKey = 1 | 2;

export const lift = (base: number, floor: FloorKey) => String(floor === 2 ? base + 100 : base);

export type WingRow =
  | { kind: "rooms"; outer: string; inner: string; left?: string; right?: string }
  | { kind: "divider"; label: string };

function roomPair(start: number, count: number): Array<[string, string]> {
  return Array.from({ length: count }, (_, index) => [
    String(start + index * 2),
    String(start + index * 2 + 1),
  ]);
}

/**
 * Vertical guest wing.
 *
 * First floor: after the approved cross-wing swap, this physical wing carries
 * rooms 136–163. The second-floor roster remains unchanged pending an explicit
 * second-floor renumbering decision.
 */
export function westWing(floor: FloorKey): WingRow[] {
  const pairs = floor === 1 ? roomPair(136, 14) : roomPair(210, 13);
  const rows: WingRow[] = [];

  pairs.forEach(([outer, inner], index) => {
    if (index === 4) rows.push({ kind: "divider", label: "Breezeway // Stairs" });
    rows.push({ kind: "rooms", outer, inner, left: outer, right: inner });
  });

  rows.push({ kind: "divider", label: "Breezeway" });
  return rows;
}

/**
 * Horizontal guest wing.
 *
 * First floor: after the approved cross-wing swap, this physical wing carries
 * rooms 110–135. Its two unused physical end slots remain intentionally blank
 * on the visual site plan. The second-floor roster remains unchanged pending an
 * explicit second-floor renumbering decision.
 */
export function northBuilding(floor: FloorKey): {
  top: string[];
  bottom: string[];
} {
  if (floor === 1) {
    return {
      top: roomPair(110, 13).map(([even]) => even),
      bottom: roomPair(110, 13).map(([, odd]) => odd),
    };
  }

  return {
    top: ["236", "238", "240", "242", "244", "246", "248", "250", "254", "258", "260", "262"],
    bottom: [
      "237",
      "239",
      "241",
      "243",
      "245",
      "247",
      "251",
      "253",
      "255",
      "259",
      "261",
      "263",
      "265",
    ],
  };
}

/** Alias retained for backward compatibility. */
export const southBuilding = northBuilding;

export type StripCell =
  { kind: "room"; number: string } | { kind: "space"; label: string; wide?: boolean };

/** Top-left lobby and administrative services block. */
export function frontBlock(floor: FloorKey): {
  upstairsLeft: string[];
  services: StripCell[];
  upstairsRight: string[];
} {
  return {
    upstairsLeft: ["201", "203", "205", "207", "209"],
    services: [
      { kind: "space", label: "GM Office" },
      { kind: "space", label: "Kitchen" },
      { kind: "space", label: "Lobby / Registration / Breakfast", wide: true },
      { kind: "space", label: "Security" },
      { kind: "room", number: floor === 2 ? "208" : "108" },
    ],
    upstairsRight: ["200", "202", "204", "206", "208"],
  };
}

export const CORNER_ROOM = 101;

export function cornerRoom(floor: FloorKey) {
  return lift(CORNER_ROOM, floor);
}

/** Back-of-house spaces in the property. */
export const SERVICE_SPACES = [
  "GM Office",
  "Kitchen",
  "Lobby / Registration / Breakfast",
  "Security",
  "Ice Machine",
  "Facility",
  "Vending",
  "GST Laundry",
  "Laundry and Storage",
] as const;

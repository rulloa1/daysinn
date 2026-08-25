/**
 * Physical layout of Days Inn Wildwood (551 FL-44).
 *
 * The map is an L-shaped compound with a lobby/service block, a horizontal
 * guest wing, a vertical guest wing, a central courtyard, and perimeter parking.
 * Room sequences follow the original property wing drawing.
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
 * The first-floor sequence is 110–135; the corresponding second-floor
 * sequence is 210–235. The breezeway separates the upper and lower sections.
 */
export function westWing(floor: FloorKey): WingRow[] {
  const pairs = floor === 1 ? roomPair(110, 13) : roomPair(210, 13);
  const rows: WingRow[] = [];

  pairs.forEach(([outer, inner], index) => {
    if (index === 4) rows.push({ kind: "divider", label: "Breezeway // Stairs" });
    rows.push({ kind: "rooms", outer, inner, left: outer, right: inner });
  });

  rows.push({ kind: "divider", label: "Breezeway" });
  return rows;
}

/**
 * Horizontal guest wing, as shown in the supplied original wing drawing.
 *
 * Room 265 is the additional second-floor room beneath the terminal 263 cell.
 * The drawing also shows stair access at the central split and at the wing end.
 */
export function northBuilding(floor: FloorKey): {
  top: string[];
  bottom: string[];
} {
  if (floor === 1) {
    return {
      top: roomPair(136, 14).map(([even]) => even),
      bottom: roomPair(136, 14).map(([, odd]) => odd),
    };
  }

  return {
    top: roomPair(236, 14).map(([even]) => even),
    bottom: [...roomPair(236, 14).map(([, odd]) => odd), "265"],
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

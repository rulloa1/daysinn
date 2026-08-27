/**
 * Physical layout of Days Inn Wildwood (551 FL-44).
 *
 * The map is an L-shaped compound with a lobby/service block, a horizontal
 * guest wing, a vertical guest wing, a central courtyard, and perimeter parking.
 * Room sequences follow the original property wing drawing.
 */

export type FloorKey = 1 | 2;

/** Room numbers confirmed not to exist at the Wildwood property. */
export const OMITTED_ROOM_NUMBERS: ReadonlySet<string> = new Set(["237", "239"]);

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
 * The visible parking-side rows begin at rooms 109 and 209. Their paired
 * courtyard-side rooms are 108 and 208, respectively, and the rows end at
 * rooms 135 and 235. The breezeway separates the upper and lower sections.
 */
export function westWing(floor: FloorKey): WingRow[] {
  const base = floor === 1 ? 108 : 208;
  const courtyardSide = Array.from({ length: 14 }, (_, index) => String(base + 26 - index * 2));
  const rows: WingRow[] = [];

  courtyardSide.forEach((outer, index) => {
    // Rooms 134–118 come before the breezeway; 116–108 follow it.
    if (index === 9) rows.push({ kind: "divider", label: "Breezeway" });
    const inner = String(base + 1 + index * 2);
    rows.push({ kind: "rooms", outer, inner, left: outer, right: inner });
  });

  return rows;
}

/**
 * Horizontal guest wing, as shown in the supplied original wing drawing.
 *
 * The pool-facing ground-floor row reads from room 136 through room 162.
 * The ground-floor end row reads right to left from room 163 through room 137.
 * Room 265 is the additional second-floor room beneath the terminal 263 cell.
 * Rooms 237 and 239 are not part of the property inventory and must not be
 * rendered in this wing. The drawing also shows stair access at the central
 * split and at the wing end.
 */
export function northBuilding(floor: FloorKey): {
  top: string[];
  bottom: string[];
} {
  if (floor === 1) {
    return {
      top: roomPair(136, 14).map(([even]) => even),
      bottom: roomPair(136, 14)
        .map(([, odd]) => odd)
        .reverse(),
    };
  }

  return {
    top: roomPair(236, 14).map(([even]) => even),
    bottom: [...roomPair(236, 14).map(([, odd]) => odd), "265"].filter(
      (number) => !OMITTED_ROOM_NUMBERS.has(number),
    ),
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
  const isUpperFloor = floor === 2;
  return {
    upstairsLeft: isUpperFloor ? ["201", "203", "205", "207", "209"] : [],
    services: [
      { kind: "space", label: "Authorized Personnel" },
      { kind: "space", label: "Lobby / Breakfast / Dining", wide: true },
    ],
    upstairsRight: isUpperFloor ? ["200", "202", "204", "206", "208"] : [],
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

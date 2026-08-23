/**
 * Physical layout of Days Inn Wildwood (551 FL-44), transcribed from the
 * aerial photo of the property with the room numbers marked on it.
 *
 * The building is one L-shaped two-storey block:
 *  - North wing (runs east/west along the top of the site): the back row of
 *    rooms faces the rear parking, the front row faces the pool courtyard.
 *  - West wing (runs north/south along the guest parking): the outer row
 *    faces the parking lot, the inner row faces the pool courtyard.
 *  - The lobby / registration corner sits where the two wings meet, with
 *    room 101 (201 upstairs) beside it.
 *
 * Every floor-1 room has a floor-2 twin at +100.
 */

export type FloorKey = 1 | 2;

const lift = (base: number, floor: FloorKey) => String(floor === 2 ? base + 100 : base);

export type WingRow =
  | { kind: "rooms"; left: string; right: string }
  | { kind: "divider"; label: string };

/** North wing: [back row (rear parking side), front row (courtyard side)]. */
export const NORTH_WING_PAIRS: [number, number][] = Array.from(
  { length: 13 },
  (_, i) => [127 + i * 2, 128 + i * 2] as [number, number],
);

/** West wing: [outer row (parking side), inner row (courtyard side)]. */
export const WEST_WING_PAIRS: [number, number][] = Array.from(
  { length: 10 },
  (_, i) => [103 + i * 2, 154 + i * 2] as [number, number],
);

export function northWing(floor: FloorKey) {
  return NORTH_WING_PAIRS.map(
    ([back, front]) => [lift(back, floor), lift(front, floor)] as const,
  );
}

export function westWing(floor: FloorKey) {
  return WEST_WING_PAIRS.map(
    ([outer, inner]) => [lift(outer, floor), lift(inner, floor)] as const,
  );
}

export function cornerRoom(floor: FloorKey) {
  return lift(CORNER_ROOM, floor);
}

export type StripCell =
  | { kind: "room"; number: string }
  | { kind: "space"; label: string; wide?: boolean };

/** The top block: Lobby, admin offices, breakfast downstairs, and 200-series upstairs. */
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
      { kind: "space", label: "Lobby / Registration", wide: true },
      { kind: "space", label: "Breakfast", wide: true },
      { kind: "space", label: "Security" },
      { kind: "room", number: "108" },
    ],
    upstairsRight: ["200", "202", "204", "206", "208"],
  };
}

/** Back-of-house spaces at the lobby corner and the end of the west wing. */
export const SERVICE_SPACES = [
  "GM Office",
  "Kitchen",
  "Lobby / Registration",
  "Breakfast",
  "Security",
  "Facility",
  "Guest Laundry",
  "Laundry & Storage",
] as const;

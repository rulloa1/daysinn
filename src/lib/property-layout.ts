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

export const lift = (base: number | string, floor: FloorKey) =>
  String(floor === 2 ? Number(base) + 100 : Number(base));

/** Corner room next to the lobby. */
export const CORNER_ROOM = 101;

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

/** Every room number on a floor, in walking order from the lobby corner. */
export function floorRooms(floor: FloorKey): string[] {
  return [
    cornerRoom(floor),
    ...northWing(floor).flatMap(([back, front]) => [back, front]),
    ...westWing(floor).flatMap(([outer, inner]) => [outer, inner]),
  ];
}

export const ALL_ROOM_NUMBERS = [...floorRooms(1), ...floorRooms(2)];

/** Which wing a room number belongs to. */
export function wingOf(number: string): "North Wing" | "West Wing" | "Lobby" {
  const base = Number(number) % 100 === 1 ? 101 : Number(number) > 200 ? Number(number) - 100 : Number(number);
  if (base === 101) return "Lobby";
  if (NORTH_WING_PAIRS.some(([a, b]) => a === base || b === base)) return "North Wing";
  return "West Wing";
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

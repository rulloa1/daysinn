/**
 * Physical layout of Days Inn Wildwood (551 FL-44), transcribed from the aerial
 * photo of the property: one L-shaped, two-story building wrapping a courtyard
 * that holds the pool, with parking on the north (highway) and west sides.
 *
 * Floor 1: 101 (corner), 103-121 odd (west wing, parking side),
 *          152-166 even (west wing, courtyard side),
 *          127-147 odd (north wing, highway side),
 *          128-144 even (north wing, courtyard side).
 * Floor 2 mirrors floor 1 with +100.
 */

export type FloorKey = 1 | 2;

export const lift = (base: number | string, floor: FloorKey) =>
  String(floor === 2 ? Number(base) + 100 : Number(base));

const range = (start: number, end: number, step = 2) => {
  const out: number[] = [];
  for (let n = start; n <= end; n += step) out.push(n);
  return out;
};

/** Corner unit at the elbow of the L (nearest the lobby/registration entrance). */
export const CORNER_ROOM = 101;

/** North wing, outer row: faces FL-44 and the truck parking. */
export const NORTH_OUTER = range(127, 147);
/** North wing, inner row: faces the courtyard and pool. */
export const NORTH_INNER = range(128, 144);

/** West wing, outer column: faces the guest parking lot. */
export const WEST_OUTER = range(103, 121);
/** West wing, inner column: faces the courtyard and pool. */
export const WEST_INNER = range(152, 166);

export function northWing(floor: FloorKey) {
  return {
    outer: NORTH_OUTER.map((n) => lift(n, floor)),
    inner: NORTH_INNER.map((n) => lift(n, floor)),
  };
}

export function westWingColumns(floor: FloorKey) {
  return {
    outer: WEST_OUTER.map((n) => lift(n, floor)),
    inner: WEST_INNER.map((n) => lift(n, floor)),
  };
}

export function cornerRoom(floor: FloorKey) {
  return lift(CORNER_ROOM, floor);
}

/** Every room number on a floor, in walking order. */
export function floorRooms(floor: FloorKey): string[] {
  const north = northWing(floor);
  const west = westWingColumns(floor);
  return [cornerRoom(floor), ...north.outer, ...north.inner, ...west.outer, ...west.inner];
}

export const ALL_ROOM_NUMBERS = [...floorRooms(1), ...floorRooms(2)];

/** Back-of-house spaces along the ground floor of the north wing. */
export const SERVICE_SPACES = [
  "Lobby / Registration",
  "Breakfast",
  "Laundry",
  "Facility",
] as const;

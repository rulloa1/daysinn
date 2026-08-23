/**
 * Physical layout of Days Inn Wildwood (551 FL-44), transcribed from the
 * property's hand-drawn floor plan.
 *
 * Two buildings:
 *  - Front block (runs north/south along the guest parking): lobby /
 *    registration at the north end with second-floor rooms 200-209 above it,
 *    then paired room rows — odd numbers on the parking side, even numbers on
 *    the courtyard side — broken up by breezeways/stairs, with facility,
 *    laundry and storage at the south end.
 *  - Rear block (east, behind the parking strip): a long two-row building,
 *    even numbers 136-162 facing the pool/parking, odd numbers 137-163 facing
 *    the rear truck parking, with stairs at each end.
 *
 * Every floor-1 room has a floor-2 twin at +100 (plus 265 at the far east end).
 */

export type FloorKey = 1 | 2;

export const lift = (base: number | string, floor: FloorKey) =>
  String(floor === 2 ? Number(base) + 100 : Number(base));

const range = (start: number, end: number, step = 2) => {
  const out: number[] = [];
  for (let n = start; n <= end; n += step) out.push(n);
  return out;
};

/** Second-floor rooms sitting above the lobby / office block (no floor-1 twin). */
export const LOBBY_UPSTAIRS_WEST = [201, 203, 205, 207, 209];
export const LOBBY_UPSTAIRS_EAST = [200, 202, 204, 206, 208];

/** Single room beside the security office, above the 110 stack. */
export const FRONT_SOLO = 108;

/** Front block, north section (between the lobby and the first breezeway). */
export const FRONT_ROWS_NORTH: [number, number][] = [
  [111, 110],
  [113, 112],
  [115, 114],
  [117, 116],
];

/** Front block, south section (between the two breezeways). */
export const FRONT_ROWS_SOUTH: [number, number][] = [
  [119, 118],
  [121, 120],
  [123, 122],
  [125, 124],
  [127, 126],
  [129, 128],
  [131, 130],
  [133, 132],
  [135, 134],
];

/** Rear block, north row (faces the parking strip and pool). */
export const REAR_ROW_NORTH = range(136, 162);
/** Rear block, south row (faces the rear truck parking). */
export const REAR_ROW_SOUTH = range(137, 163);

/** Extra second-floor room at the far east end of the rear block. */
export const EXTRA_UPSTAIRS = "265";

export function frontRows(floor: FloorKey) {
  return {
    solo: lift(FRONT_SOLO, floor),
    north: FRONT_ROWS_NORTH.map(([odd, even]) => [lift(odd, floor), lift(even, floor)] as const),
    south: FRONT_ROWS_SOUTH.map(([odd, even]) => [lift(odd, floor), lift(even, floor)] as const),
  };
}

export function rearRows(floor: FloorKey) {
  return {
    north: REAR_ROW_NORTH.map((n) => lift(n, floor)),
    south: REAR_ROW_SOUTH.map((n) => lift(n, floor)),
  };
}

/** Every room number on a floor, in walking order. */
export function floorRooms(floor: FloorKey): string[] {
  const front = frontRows(floor);
  const rear = rearRows(floor);
  const lobby = floor === 2 ? [...LOBBY_UPSTAIRS_WEST, ...LOBBY_UPSTAIRS_EAST].map(String) : [];
  const rows = [...front.north, ...front.south].flatMap(([odd, even]) => [odd, even]);
  return [
    ...lobby,
    front.solo,
    ...rows,
    ...rear.north,
    ...rear.south,
    ...(floor === 2 ? [EXTRA_UPSTAIRS] : []),
  ];
}

export const ALL_ROOM_NUMBERS = [...floorRooms(1), ...floorRooms(2)];

/** Back-of-house spaces in the front block. */
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

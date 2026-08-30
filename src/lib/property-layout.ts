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

/** Shared exterior access points, keyed to the rooms immediately beside them. */
export const STAIR_LOCATIONS = [
  { label: "Stairs outside 158 / 258", outsideRooms: ["158", "258"] as const },
  {
    label: "Stairs between 157 / 159 and 257 / 259",
    outsideRooms: ["157", "159", "257", "259"] as const,
  },
  { label: "Front-entrance stairwell after 201", outsideRooms: ["201"] as const },
  { label: "Stairs between 132 / 130", outsideRooms: ["132", "130"] as const },
] as const;

/** Verified landmarks shared by each interactive property-map view. */
export type PropertyMapLocation = {
  name: string;
  aliases: readonly string[];
  left: number;
  top: number;
};

export const VERIFIED_MAP_LOCATIONS: readonly PropertyMapLocation[] = [
  { name: "Swim Pool", aliases: ["pool", "swimming", "swim pool"], left: 53.12, top: 34.0 },
  {
    name: "Lobby / Registration / Breakfast",
    aliases: ["lobby", "front desk", "registration", "breakfast", "dining"],
    left: 15.0,
    top: 83.8,
  },
  {
    name: "GM Office",
    aliases: ["gm office", "management", "manager", "office"],
    left: 7.5,
    top: 83.8,
  },
  {
    name: "Kitchen",
    aliases: ["kitchen", "food prep"],
    left: 11.25,
    top: 83.8,
  },
  {
    name: "Security",
    aliases: ["security", "guard", "security office"],
    left: 18.75,
    top: 83.8,
  },
  {
    name: "Laundry and Storage",
    aliases: ["laundry", "storage", "guest laundry", "facility"],
    left: 11.25,
    top: 91.6,
  },
  {
    name: "Stairs (East Wing)",
    aliases: ["stairs", "stairwell", "east stairs", "building 3 stairs"],
    left: 77.81,
    top: 77.5,
  },
  {
    name: "Stairs (North Breezeway)",
    aliases: ["stairs", "stairwell", "north stairs", "lobby stairs"],
    left: 20.62,
    top: 68.0,
  },
  {
    name: "Stairs (South Facility)",
    aliases: ["stairs", "stairwell", "south stairs", "laundry stairs"],
    left: 18.75,
    top: 88.0,
  },
  {
    name: "Pool Equipment",
    aliases: ["pool equipment", "restrooms", "pool house"],
    left: 67.06,
    top: 32.7,
  },
  {
    name: "Truck Parking (Guest)",
    aliases: ["truck", "rv", "truck parking", "bus parking"],
    left: 11.25,
    top: 40.0,
  },
  {
    name: "Back Parking",
    aliases: ["back parking", "rear parking", "north parking"],
    left: 37.5,
    top: 9.4,
  },
  {
    name: "Front Parking",
    aliases: ["front parking", "east parking"],
    left: 90.62,
    top: 48.0,
  },
  {
    name: "Main Entrance",
    aliases: ["entrance", "main entrance", "driveway"],
    left: 38.75,
    top: 97.5,
  },
];

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
 * rooms 135 and 235. Exterior stairs sit between rooms 132 and 130. The
 * breezeway runs between rooms 117 and 119 on the ground floor (217 and 219
 * upstairs), separating the upper and lower sections.
 */
export function westWing(floor: FloorKey): WingRow[] {
  const base = floor === 1 ? 108 : 208;
  const courtyardSide = Array.from({ length: 14 }, (_, index) => String(base + 26 - index * 2));
  const rows: WingRow[] = [];

  courtyardSide.forEach((outer, index) => {
    // Rooms 134–126 / 109–117 come before the breezeway (between rooms 117 and
    // 119 on the ground floor, 217 and 219 upstairs); 124–108 / 119–135 follow.
    if (index === 5) rows.push({ kind: "divider", label: "Breezeway" });
    const inner = String(base + 1 + index * 2);
    rows.push({ kind: "rooms", outer, inner, left: outer, right: inner });
  });

  return rows;
}

/**
 * Horizontal guest wing, as shown in the supplied original wing drawing.
 *
 * The pool-facing ground-floor row reads from room 136 through room 162, with
 * exterior stairs immediately outside rooms 158 and 258 and between rooms
 * 157/159 and 257/259. The ground-floor end row reads right to left from room
 * 163 through room 137.
 * Room 265 is the additional second-floor room beneath the terminal 263 cell.
 * Rooms 237 and 239 are not part of the property inventory and must not be
 * rendered in this wing. The drawing also shows stair access at the central
 * split and at the wing end.
 */
export function northBuilding(floor: FloorKey): {
  top: string[];
  bottom: string[];
  topBreezewayAfter?: string;
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
    // Upper-floor, pool-facing row runs right to left and reaches a breezeway
    // immediately after room 214. The following segment remains pending
    // physical-layout confirmation.
    top: ["200", "202", "204", "206", "208", "210", "212", "214"],
    topBreezewayAfter: "214",
    bottom: [...roomPair(236, 14).map(([, odd]) => odd), "265"].filter(
      (number) => !OMITTED_ROOM_NUMBERS.has(number),
    ),
  };
}

/** Alias retained for backward compatibility. */
export const southBuilding = northBuilding;

export type StripCell =
  | { kind: "room"; number: string }
  | { kind: "space"; label: string; wide?: boolean; underRoom?: string };

/** Top-left lobby and administrative services block. */
export function frontBlock(floor: FloorKey): {
  upstairsLeft: string[];
  upstairsLeftBreezewayBefore?: string;
  upstairsLeftStairwellAfter?: string;
  services: StripCell[];
  upstairsRight: string[];
} {
  const isUpperFloor = floor === 2;
  return {
    // Upper-floor front-entrance side reads from the breezeway to the stairwell.
    upstairsLeft: isUpperFloor
      ? ["217", "215", "213", "211", "210", "209", "207", "205", "203", "201"]
      : [],
    ...(isUpperFloor
      ? {
          upstairsLeftBreezewayBefore: "217",
          upstairsLeftStairwellAfter: "201",
        }
      : {}),
    services: [
      // The space directly beneath room 206, facing the pool.
      { kind: "space", label: "Authorized Personnel Only", underRoom: "206" },
      // A second restricted room directly beneath room 209.
      { kind: "space", label: "Authorized Personnel Only", underRoom: "209" },
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

/**
 * Physical layout of Days Inn Wildwood (551 FL-44), transcribed directly from
 * the aerial architectural overlay and property blueprints.
 *
 * The property is an L-shaped compound:
 *  1. Top-Left Corner: Lobby, Registration, Breakfast, GM Office, Kitchen, Security, Room 108/208, Ice, Breezeway/Stairs.
 *  2. North Wing (Horizontal Top Building): Rooms 136-162 (outer/even) & 137-163/265 (inner/odd) with central breezeway.
 *  3. West Wing (Vertical Left Building): Rooms 110-134 (inner/even) & 111-135 (outer/odd) + BOH (Facility, Vending, Laundry & Storage).
 *  4. Central Courtyard: Heated Swim Pool, Sun Deck, and Central Parking.
 *  5. Perimeter: Truck parking (FL-44 top frontage & rear south), East parking driveway.
 */

export type FloorKey = 1 | 2;

export const lift = (base: number, floor: FloorKey) => String(floor === 2 ? base + 100 : base);

export type WingRow =
  | { kind: "rooms"; outer: string; inner: string; left?: string; right?: string }
  | { kind: "divider"; label: string };

/**
 * West Wing (Vertical Building along guest parking):
 * - Outer (Left) column: Odd numbers facing west parking (111-117, 119-135)
 * - Inner (Right) column: Even numbers facing pool courtyard (110-116, 120-134)
 */
export function westWing(floor: FloorKey): WingRow[] {
  const rows: WingRow[] = [];

  // Upper section: 111-117 (outer) & 110-116 (inner)
  for (let odd = 111; odd <= 117; odd += 2) {
    const outer = lift(odd, floor);
    const inner = lift(odd - 1, floor);
    rows.push({ kind: "rooms", outer, inner, left: outer, right: inner });
  }

  rows.push({ kind: "divider", label: "Breezeway // Stairs" });

  // Lower section: 119-135 (outer) & 120-134 (inner)
  const lowerOdds = [119, 121, 123, 125, 127, 129, 131, 133, 135];
  const lowerEvens = [120, 122, 124, 126, 128, 130, 132, 134, 134];

  for (let i = 0; i < lowerOdds.length; i++) {
    const outer = lift(lowerOdds[i]!, floor);
    const inner = lift(lowerEvens[i]!, floor);
    rows.push({ kind: "rooms", outer, inner, left: outer, right: inner });
  }

  rows.push({ kind: "divider", label: "Breezeway" });
  return rows;
}

/**
 * North Wing (Horizontal Top Building running east from Lobby Corner):
 * - Top (Outer) row: Even rooms facing North / Truck Parking (136-162 / 236-262)
 * - Bottom (Inner) row: Odd rooms facing Swim Pool / Courtyard (137-163 / 237-265)
 */
export function northBuilding(floor: FloorKey): {
  top: string[];
  bottom: string[];
} {
  if (floor === 1) {
    return {
      top: ["136", "138", "140", "142", "144", "146", "148", "150", "154", "156", "160", "162"],
      bottom: ["137", "139", "141", "143", "145", "147", "149", "151", "155", "157", "161", "163"],
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

/** Alias for backward compatibility */
export const southBuilding = northBuilding;

export type StripCell =
  { kind: "room"; number: string } | { kind: "space"; label: string; wide?: boolean };

/**
 * Top-Left Corner (Lobby & Administrative Services Block):
 */
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

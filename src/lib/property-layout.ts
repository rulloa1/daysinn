/**
 * Physical layout of Days Inn Wildwood (551 FL-44), transcribed directly from
 * the property architectural sketch.
 *
 * Floor 1 rooms: 108, 110-135 (West Wing), 136-163 (South Wing).
 * Floor 2 rooms: 200-209 (Top/Lobby), 210-235 (West Wing), 236-265 (South Wing).
 */

export type FloorKey = 1 | 2;

const lift = (base: number, floor: FloorKey) => String(floor === 2 ? base + 100 : base);

export type WingRow =
  | { kind: "rooms"; left: string; right: string }
  | { kind: "divider"; label: string };

/** West wing: two rooms per row (odd numbers inside/courtyard, even numbers outside/parking). */
export function westWing(floor: FloorKey): WingRow[] {
  const rows: WingRow[] = [];
  // Upper section: 111-117 (odd, inside) & 110-116 (even, outside)
  for (let odd = 111; odd <= 117; odd += 2) {
    rows.push({ kind: "rooms", left: lift(odd, floor), right: lift(odd - 1, floor) });
  }
  rows.push({ kind: "divider", label: "Breezeway // Stairs" });
  // Lower section: 119-135 (odd, inside) & 118-134 (even, outside)
  for (let odd = 119; odd <= 135; odd += 2) {
    rows.push({ kind: "rooms", left: lift(odd, floor), right: lift(odd - 1, floor) });
  }
  rows.push({ kind: "divider", label: "Breezeway" });
  return rows;
}

/** South building: long double-loaded corridor (top row evens facing courtyard, bottom row odds facing outer parking). */
export function southBuilding(floor: FloorKey): { top: string[]; bottom: string[] } {
  const top: string[] = [];
  for (let n = 136; n <= 162; n += 2) top.push(lift(n, floor));

  const bottom: string[] = [];
  for (let n = 137; n <= 161; n += 2) bottom.push(lift(n, floor));
  bottom.push(lift(163, floor));
  if (floor === 2) bottom.push("265");

  return { top, bottom };
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

/** Back-of-house spaces at the bottom of the west wing. */
export const SERVICE_SPACES = ["Facility", "GST Laundry", "Laundry & Storage"];

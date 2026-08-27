import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { FloorKey } from "@/lib/property-layout";
import propertyMapImage from "@/assets/property_map_final.png";

type RoomStatus =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "out_of_order" | "reserved";

export type MapRoom = {
  id: string;
  number: string;
  status: RoomStatus;
  guest_name?: string | null;
};

export type FloorView = FloorKey | "both";

/** Solid background colors per status for high contrast over the photo */
const PILL_BG: Record<RoomStatus, string> = {
  vacant_clean: "border-emerald-700 bg-emerald-500 text-white",
  vacant_dirty: "border-amber-600 bg-amber-300 text-slate-950",
  occupied: "border-red-800 bg-red-600 text-white",
  occupied_dnd: "border-red-950 bg-red-800 text-white",
  reserved: "border-sky-700 bg-sky-400 text-slate-950",
  out_of_order: "border-slate-500 bg-slate-400 text-slate-950",
};

type Props = {
  floor: FloorView;
  rooms: MapRoom[];
  openRequests?: Map<string, number> | undefined;
  dimmed?: Set<string> | undefined;
  onFloorChange?: ((floor: FloorView) => void) | undefined;
  onSelect: (roomId: string) => void;
};

type FacilityMarker = {
  name: string;
  aliases: string[];
  left: number;
  top: number;
};

const FACILITY_MARKERS: FacilityMarker[] = [
  { name: "Pool", aliases: ["pool", "swimming"], left: 50, top: 51 },
  { name: "Lobby", aliases: ["lobby", "front desk", "breakfast"], left: 31, top: 50 },
  { name: "Laundry", aliases: ["laundry", "storage"], left: 72, top: 68 },
  { name: "Truck parking", aliases: ["truck", "rv", "parking"], left: 50, top: 91 },
];

/**
 * Percentage-based [left%, top%] coordinates for each room number.
 *
 * Calibrated against the official "Days Inn by Wyndham Wildwood I-75" site plan.
 * Image ~1024×640. Building map occupies roughly x:14%–87%, y:12%–88%.
 *
 * Layout (0,0 = top-left corner of the full image):
 *
 *  BACK PARKING (top edge)
 *  ┌─────────────────────────────────────────────────────────────────┐  ← y≈14%
 *  │ Lobby │ 201 203 205 207 209 211 213 215 217 219 221 223 225 227 229 233 │ ← floor 1 top row
 *  │ block │ 202 204 206 208 210 212 214 216 218 220 222 224 228 230 232 234 │ ← floor 1 bot row
 *  ├───────┤  (north horizontal wing)                                        ← y≈28%
 *  │101 102│
 *  │103 104│   SWIMMING POOL          COURTYARD (grass)
 *  │ ...   │
 *  │133 134│
 *  └───────┘  ← y≈88%
 *  FRONT PARKING / MAIN ENTRANCE (bottom edge)
 *
 * 1xx = floor 1, 2xx = floor 2 (same physical location, +1.5% y offset in "both" view).
 */
const BASE_ROOM_COORDS: Record<string, [number, number]> = {
  "110": [64.0, 27.5],
  "111": [64.0, 23.5],
  "112": [59.8, 27.5],
  "113": [59.8, 23.5],
  "114": [55.5, 27.5],
  "115": [55.5, 23.5],
  "116": [51.2, 27.5],
  "117": [51.2, 23.5],
  "118": [47.0, 27.5],
  "119": [47.0, 23.5],
  "120": [42.8, 27.5],
  "121": [42.8, 23.5],
  "122": [38.5, 27.5],
  "123": [38.5, 23.5],
  "124": [34.2, 27.5],
  "125": [34.2, 23.5],
  "126": [30.0, 27.5],
  "127": [30.0, 23.5],
  "128": [25.8, 27.5],
  "129": [25.8, 23.5],
  "130": [21.5, 27.5],
  "131": [21.5, 23.5],
  "132": [17.2, 27.5],
  "133": [17.2, 23.5],
  "134": [13.0, 27.5],
  "135": [13.0, 23.5],
  "136": [83.5, 29.0],
  "137": [80.5, 29.0],
  "138": [83.5, 32.0],
  "139": [80.5, 32.0],
  "140": [83.5, 35.0],
  "141": [80.5, 35.0],
  "142": [83.5, 38.0],
  "143": [80.5, 38.0],
  "144": [83.5, 41.0],
  "145": [80.5, 41.0],
  "146": [83.5, 44.0],
  "147": [80.5, 44.0],
  "148": [83.5, 47.0],
  "149": [80.5, 47.0],
  "150": [83.5, 50.0],
  "151": [80.5, 50.0],
  "152": [83.5, 53.0],
  "153": [80.5, 53.0],
  "154": [83.5, 56.0],
  "155": [80.5, 56.0],
  "156": [83.5, 59.0],
  "157": [80.5, 59.0],
  "158": [83.5, 62.0],
  "159": [80.5, 62.0],
  "160": [83.5, 65.0],
  "161": [80.5, 65.0],
  "162": [83.5, 68.0],
  "163": [80.5, 68.0],
  "200": [81.5, 28.5],
  "201": [81.5, 24.5],
  "202": [78.0, 28.5],
  "203": [78.0, 24.5],
  "204": [74.5, 28.5],
  "205": [74.5, 24.5],
  "206": [71.0, 28.5],
  "207": [71.0, 24.5],
  "208": [67.5, 28.5],
  "209": [67.5, 24.5],
  "210": [63.0, 28.5],
  "211": [63.0, 24.5],
  "212": [58.8, 28.5],
  "213": [58.8, 24.5],
  "214": [54.5, 28.5],
  "215": [54.5, 24.5],
  "216": [50.2, 28.5],
  "217": [50.2, 24.5],
  "218": [46.0, 28.5],
  "219": [46.0, 24.5],
  "220": [41.8, 28.5],
  "221": [41.8, 24.5],
  "222": [37.5, 28.5],
  "223": [37.5, 24.5],
  "224": [33.2, 28.5],
  "225": [33.2, 24.5],
  "226": [29.0, 28.5],
  "227": [29.0, 24.5],
  "228": [24.8, 28.5],
  "229": [24.8, 24.5],
  "230": [20.5, 28.5],
  "231": [20.5, 24.5],
  "232": [16.2, 28.5],
  "233": [16.2, 24.5],
  "234": [12.0, 28.5],
  "235": [12.0, 24.5],
  "236": [82.5, 30.0],
  "237": [79.5, 30.0],
  "238": [82.5, 33.0],
  "239": [79.5, 33.0],
  "240": [82.5, 36.0],
  "241": [79.5, 36.0],
  "242": [82.5, 39.0],
  "243": [79.5, 39.0],
  "244": [82.5, 42.0],
  "245": [79.5, 42.0],
  "246": [82.5, 45.0],
  "247": [79.5, 45.0],
  "248": [82.5, 48.0],
  "249": [79.5, 48.0],
  "250": [82.5, 51.0],
  "251": [79.5, 51.0],
  "252": [82.5, 54.0],
  "253": [79.5, 54.0],
  "254": [82.5, 57.0],
  "255": [79.5, 57.0],
  "256": [82.5, 60.0],
  "257": [79.5, 60.0],
  "258": [82.5, 63.0],
  "259": [79.5, 63.0],
  "260": [82.5, 66.0],
  "261": [79.5, 66.0],
  "262": [82.5, 69.0],
  "263": [79.5, 69.0],
  "265": [79.5, 71.0],
};

/**
 * The approved first-floor cross-wing swap. Rooms 110–135 use the former
 * vertical-wing positions, while 136–163 use the former horizontal-wing
 * positions. The final pair adds the two confirmed end positions required to
 * preserve every room number.
 */
function firstFloorWingSwapCoordinates(): Record<string, [number, number]> {
  const coordinates: Record<string, [number, number]> = {};

  for (let offset = 0; offset < 26; offset++) {
    coordinates[String(110 + offset)] = BASE_ROOM_COORDS[String(136 + offset)]!;
    coordinates[String(136 + offset)] = BASE_ROOM_COORDS[String(110 + offset)]!;
  }

  coordinates["162"] = [8.8, 27.5];
  coordinates["163"] = [8.8, 23.5];
  return coordinates;
}

const ROOM_COORDS: Record<string, [number, number]> = {
  ...BASE_ROOM_COORDS,
  ...firstFloorWingSwapCoordinates(),
};

/** The two final vertical-wing cells are intentionally unused after the swap. */
const UNUSED_FIRST_FLOOR_SLOTS: Array<[number, number]> = [
  BASE_ROOM_COORDS["162"]!,
  BASE_ROOM_COORDS["163"]!,
];

/** Filter rooms to the floors the user wants to see */
function filterByFloor(rooms: MapRoom[], floor: FloorView): MapRoom[] {
  if (floor === "both") return rooms;
  return rooms.filter((r) => {
    const n = Number(r.number);
    return floor === 1 ? n < 200 : n >= 200;
  });
}

export function FloorPlan({ floor, rooms, openRequests, dimmed, onFloorChange, onSelect }: Props) {
  const [localFloor, setLocalFloor] = useState<FloorKey>(floor === "both" ? 1 : floor);
  const [query, setQuery] = useState("");
  const [housekeepingOnly, setHousekeepingOnly] = useState(false);

  useEffect(() => {
    if (floor !== "both") setLocalFloor(floor);
  }, [floor]);

  const activeFloor = onFloorChange ? floor : localFloor;
  const normalizedQuery = query.trim().toLowerCase();

  const matchingFacilities = useMemo(
    () =>
      normalizedQuery
        ? FACILITY_MARKERS.filter((facility) =>
            [facility.name, ...facility.aliases].some((term) => term.includes(normalizedQuery)),
          )
        : [],
    [normalizedQuery],
  );

  const visibleRooms = useMemo(
    () =>
      filterByFloor(rooms, activeFloor).filter((room) => {
        const matchesHousekeeping = !housekeepingOnly || room.status === "vacant_dirty";
        const matchesQuery =
          !normalizedQuery ||
          room.number.includes(normalizedQuery) ||
          room.guest_name?.toLowerCase().includes(normalizedQuery);
        return matchesHousekeeping && Boolean(matchesQuery);
      }),
    [activeFloor, housekeepingOnly, normalizedQuery, rooms],
  );

  const floorRooms = useMemo(() => filterByFloor(rooms, activeFloor), [activeFloor, rooms]);
  const attentionSummary = useMemo(
    () => [
      {
        label: "Dirty",
        count: floorRooms.filter((room) => room.status === "vacant_dirty").length,
        tone: "bg-amber-100 text-amber-900",
      },
      {
        label: "DND",
        count: floorRooms.filter((room) => room.status === "occupied_dnd").length,
        tone: "bg-red-100 text-red-900",
      },
      {
        label: "Maintenance",
        count: floorRooms.filter((room) => room.status === "out_of_order").length,
        tone: "bg-slate-200 text-slate-800",
      },
      {
        label: "Open requests",
        count: floorRooms.reduce((total, room) => total + (openRequests?.get(room.number) ?? 0), 0),
        tone: "bg-sky-100 text-sky-900",
      },
    ],
    [floorRooms, openRequests],
  );

  function changeFloor(next: FloorKey) {
    if (onFloorChange) onFloorChange(next);
    else setLocalFloor(next);
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-300 bg-[#f5f3ee] text-slate-950 shadow-2xl shadow-slate-950/20">
      <header className="border-b border-slate-200 bg-white px-4 pb-4 pt-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Days Inn Wildwood
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
              Detailed property map
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tap a room for its live operational details.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
            Live room status
          </span>
        </div>

        <div
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
          aria-label="Map attention summary"
        >
          {attentionSummary.map((item) => (
            <div key={item.label} className={`rounded-xl px-3 py-2 ${item.tone}`}>
              <p className="text-lg font-black leading-none">{item.count}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Search rooms and facilities</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search rooms, guests, facilities…"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-base outline-none transition focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-600/15"
          />
        </label>

        <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 rounded-2xl bg-slate-200 p-1.5">
          {([1, 2] as const).map((nextFloor) => (
            <button
              key={nextFloor}
              type="button"
              onClick={() => changeFloor(nextFloor)}
              aria-pressed={activeFloor === nextFloor}
              className={`min-h-10 rounded-xl px-3 text-sm font-extrabold transition ${
                activeFloor === nextFloor
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
              }`}
            >
              {nextFloor === 1 ? "1st Floor" : "2nd Floor"}
            </button>
          ))}
          {onFloorChange ? (
            <button
              type="button"
              onClick={() => onFloorChange("both")}
              aria-pressed={activeFloor === "both"}
              className={`rounded-xl px-3 text-xs font-bold transition ${
                activeFloor === "both"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
              }`}
            >
              All
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setHousekeepingOnly((current) => !current)}
            aria-pressed={housekeepingOnly}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition ${
              housekeepingOnly
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Housekeeping {housekeepingOnly ? "on" : "filter"}
          </button>
          <p className="text-xs font-medium text-slate-500">
            {visibleRooms.length} room{visibleRooms.length === 1 ? "" : "s"} shown
          </p>
        </div>
      </header>

      <div className="relative bg-slate-800 p-2 sm:p-3">
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700">
          <img
            src={propertyMapImage}
            alt="Days Inn Wildwood detailed property map"
            className="block w-full select-none"
            draggable={false}
          />

          {/* The two physical cells not occupied by the 110–135 range stay visibly unused. */}
          {activeFloor !== 2 &&
            UNUSED_FIRST_FLOOR_SLOTS.map(([left, top]) => (
              <span
                key={`unused-${left}-${top}`}
                title="Unused physical room slot"
                style={{ left: `${left}%`, top: `${top}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded border border-slate-400/70 bg-slate-100/95 px-1 py-0.5 text-[7px] font-bold uppercase tracking-tight text-slate-600 shadow-sm"
              >
                Unused
              </span>
            ))}

          {matchingFacilities.map((facility) => (
            <span
              key={facility.name}
              style={{ left: `${facility.left}%`, top: `${facility.top}%` }}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-4 border-white bg-sky-500 px-2.5 py-1 text-[10px] font-black text-white shadow-lg ring-4 ring-sky-300/50"
            >
              {facility.name}
            </span>
          ))}

          {/* Overlay room pills at percentage positions */}
          {visibleRooms.map((room) => {
            const coords = ROOM_COORDS[room.number];
            if (!coords) return null;
            const [left, top] = coords;
            const open = openRequests?.get(room.number) ?? 0;
            const faded = dimmed?.size ? !dimmed.has(room.number) : false;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelect(room.id)}
                title={`Room ${room.number} · ${room.guest_name ?? "Vacant"} (${room.status.replace(/_/g, " ")})`}
                style={{ left: `${left}%`, top: `${top}%` }}
                className={[
                  "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded border px-1 py-0.5 font-mono text-[7px] font-black leading-none shadow-md transition duration-150 sm:text-[8px]",
                  "hover:z-30 hover:scale-[1.45] focus:z-30 focus:scale-[1.45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  PILL_BG[room.status],
                  faded ? "cursor-default opacity-20" : "cursor-pointer opacity-95",
                ].join(" ")}
              >
                {room.number}
                {open > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-950 text-[7px] font-black text-white shadow ring-1 ring-white">
                    {open}
                  </span>
                )}
              </button>
            );
          })}

          <div className="absolute bottom-2 right-2 z-20 rounded-xl bg-white/95 p-2.5 text-[10px] font-bold text-slate-800 shadow-lg sm:bottom-3 sm:right-3 sm:p-3 sm:text-xs">
            <p className="mb-1.5 text-[9px] uppercase tracking-wider text-slate-500">Room status</p>
            <div className="grid gap-1">
              {[
                ["bg-emerald-500", "Available"],
                ["bg-red-600", "Occupied"],
                ["bg-amber-300", "Dirty / cleaning"],
                ["bg-slate-400", "Maintenance"],
              ].map(([color, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {normalizedQuery && !visibleRooms.length ? (
        <p
          className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
          aria-live="polite"
        >
          {matchingFacilities.length
            ? `Showing ${matchingFacilities.map((facility) => facility.name).join(" and ")} on the map.`
            : "No rooms match that search. Try a room number, guest name, pool, lobby, laundry, or parking."}
        </p>
      ) : null}

      {/* FALLBACK: rooms without photo coordinates */}
      {(() => {
        const unmapped = visibleRooms.filter((r) => !ROOM_COORDS[r.number]);
        if (!unmapped.length) return null;
        return (
          <div className="border-t border-slate-200 bg-white px-4 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Additional rooms
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unmapped.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelect(room.id)}
                  title={`Room ${room.number}`}
                  className={`rounded border px-2 py-1 text-[10px] font-bold font-mono shadow transition-all hover:scale-105 ${PILL_BG[room.status]}`}
                >
                  {room.number}
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </section>
  );
}

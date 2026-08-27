import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { FloorKey } from "@/lib/property-layout";
import propertyMapImage from "@/assets/property_map_3d.png";

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
  { name: "Pool", aliases: ["pool", "swimming"], left: 45, top: 30 },
  { name: "Lobby", aliases: ["lobby", "front desk", "breakfast"], left: 15, top: 60 },
  { name: "Laundry", aliases: ["laundry", "storage"], left: 65, top: 50 },
  { name: "Truck parking", aliases: ["truck", "rv", "parking"], left: 20, top: 20 },
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
const ROOM_COORDS: Record<string, [number, number]> = {
  "100": [12.0, 46.0],
  "101": [12.0, 58.0],
  "102": [15.1, 46.5],
  "103": [15.4, 58.6],
  "104": [18.2, 47.1],
  "105": [18.8, 59.2],
  "106": [21.4, 47.6],
  "107": [22.2, 59.8],
  "108": [24.5, 48.1],
  "109": [25.6, 60.4],
  "110": [27.6, 48.6],
  "111": [29.1, 60.9],
  "112": [30.7, 49.2],
  "113": [32.5, 61.5],
  "114": [33.8, 49.7],
  "115": [35.9, 62.1],
  "116": [36.9, 50.2],
  "117": [39.3, 62.7],
  "118": [40.1, 50.8],
  "119": [42.7, 63.3],
  "120": [43.2, 51.3],
  "121": [46.1, 63.9],
  "122": [46.3, 51.8],
  "123": [49.5, 64.5],
  "124": [49.4, 52.4],
  "125": [52.9, 65.1],
  "126": [52.5, 52.9],
  "127": [56.4, 65.6],
  "128": [55.6, 53.4],
  "129": [59.8, 66.2],
  "130": [58.8, 53.9],
  "131": [63.2, 66.8],
  "132": [61.9, 54.5],
  "133": [66.6, 67.4],
  "134": [65.0, 55.0],
  "135": [70.0, 68.0],
  "136": [65.0, 55.0],
  "137": [73.0, 56.0],
  "138": [64.8, 51.5],
  "139": [72.8, 52.4],
  "140": [64.6, 48.0],
  "141": [72.6, 48.9],
  "142": [64.4, 44.5],
  "143": [72.4, 45.3],
  "144": [64.1, 41.0],
  "145": [72.1, 41.7],
  "146": [63.9, 37.5],
  "147": [71.9, 38.1],
  "148": [63.7, 34.0],
  "149": [71.7, 34.6],
  "150": [63.5, 30.5],
  "151": [71.5, 31.0],
  "152": [63.3, 27.0],
  "153": [71.3, 27.4],
  "154": [63.1, 23.5],
  "155": [71.1, 23.9],
  "156": [62.9, 20.0],
  "157": [70.9, 20.3],
  "158": [62.6, 16.5],
  "159": [70.6, 16.7],
  "160": [62.4, 13.0],
  "161": [70.4, 13.1],
  "162": [62.2, 9.5],
  "163": [70.2, 9.6],
  "164": [62.0, 6.0],
  "165": [70.0, 6.0],
  "200": [12.8, 47.2],
  "201": [12.8, 59.2],
  "202": [15.9, 47.7],
  "203": [16.2, 59.8],
  "204": [19.0, 48.3],
  "205": [19.6, 60.4],
  "206": [22.2, 48.8],
  "207": [23.0, 61.0],
  "208": [25.3, 49.3],
  "209": [26.4, 61.6],
  "210": [28.4, 49.8],
  "211": [29.9, 62.1],
  "212": [31.5, 50.4],
  "213": [33.3, 62.7],
  "214": [34.6, 50.9],
  "215": [36.7, 63.3],
  "216": [37.7, 51.4],
  "217": [40.1, 63.9],
  "218": [40.9, 52.0],
  "219": [43.5, 64.5],
  "220": [44.0, 52.5],
  "221": [46.9, 65.1],
  "222": [47.1, 53.0],
  "223": [50.3, 65.7],
  "224": [50.2, 53.6],
  "225": [53.7, 66.3],
  "226": [53.3, 54.1],
  "227": [57.2, 66.8],
  "228": [56.4, 54.6],
  "229": [60.6, 67.4],
  "230": [59.6, 55.1],
  "231": [64.0, 68.0],
  "232": [62.7, 55.7],
  "233": [67.4, 68.6],
  "234": [65.8, 56.2],
  "235": [70.8, 69.2],
  "236": [65.8, 56.2],
  "237": [73.8, 57.2],
  "238": [65.6, 52.7],
  "239": [73.6, 53.6],
  "240": [65.4, 49.2],
  "241": [73.4, 50.1],
  "242": [65.2, 45.7],
  "243": [73.2, 46.5],
  "244": [64.9, 42.2],
  "245": [72.9, 42.9],
  "246": [64.7, 38.7],
  "247": [72.7, 39.3],
  "248": [64.5, 35.2],
  "249": [72.5, 35.8],
  "250": [64.3, 31.7],
  "251": [72.3, 32.2],
  "252": [64.1, 28.2],
  "253": [72.1, 28.6],
  "254": [63.9, 24.7],
  "255": [71.9, 25.1],
  "256": [63.7, 21.2],
  "257": [71.7, 21.5],
  "258": [63.4, 17.7],
  "259": [71.4, 17.9],
  "260": [63.2, 14.2],
  "261": [71.2, 14.3],
  "262": [63.0, 10.7],
  "263": [71.0, 10.8],
  "264": [62.8, 7.2],
  "265": [70.8, 7.2],
};

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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
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
                  "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded border px-1 py-0.5 font-mono text-[7px] font-black leading-none shadow-md transition-all duration-500 sm:text-[8px]",
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

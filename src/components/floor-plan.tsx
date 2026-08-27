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
  "100": [15.0, 55.0],
  "101": [15.0, 61.0],
  "102": [18.5, 55.0],
  "103": [18.5, 61.0],
  "104": [22.1, 55.0],
  "105": [22.1, 61.0],
  "106": [25.6, 55.0],
  "107": [25.6, 61.0],
  "108": [29.1, 55.0],
  "109": [29.1, 61.0],
  "110": [32.6, 55.0],
  "111": [32.6, 61.0],
  "112": [36.2, 55.0],
  "113": [36.2, 61.0],
  "114": [39.7, 55.0],
  "115": [39.7, 61.0],
  "116": [43.2, 55.0],
  "117": [43.2, 61.0],
  "118": [46.8, 55.0],
  "119": [46.8, 61.0],
  "120": [50.3, 55.0],
  "121": [50.3, 61.0],
  "122": [53.8, 55.0],
  "123": [53.8, 61.0],
  "124": [57.4, 55.0],
  "125": [57.4, 61.0],
  "126": [60.9, 55.0],
  "127": [60.9, 61.0],
  "128": [64.4, 55.0],
  "129": [64.4, 61.0],
  "130": [67.9, 55.0],
  "131": [67.9, 61.0],
  "132": [71.5, 55.0],
  "133": [71.5, 61.0],
  "134": [75.0, 55.0],
  "135": [75.0, 61.0],
  "136": [75.0, 50.0],
  "137": [81.0, 50.0],
  "138": [75.0, 47.5],
  "139": [81.0, 47.5],
  "140": [75.0, 45.0],
  "141": [81.0, 45.0],
  "142": [75.0, 42.5],
  "143": [81.0, 42.5],
  "144": [75.0, 40.0],
  "145": [81.0, 40.0],
  "146": [75.0, 37.5],
  "147": [81.0, 37.5],
  "148": [75.0, 35.0],
  "149": [81.0, 35.0],
  "150": [75.0, 32.5],
  "151": [81.0, 32.5],
  "152": [75.0, 30.0],
  "153": [81.0, 30.0],
  "154": [75.0, 27.5],
  "155": [81.0, 27.5],
  "156": [75.0, 25.0],
  "157": [81.0, 25.0],
  "158": [75.0, 22.5],
  "159": [81.0, 22.5],
  "160": [75.0, 20.0],
  "161": [81.0, 20.0],
  "162": [75.0, 17.5],
  "163": [81.0, 17.5],
  "164": [75.0, 15.0],
  "165": [81.0, 15.0],
  "200": [15.8, 56.2],
  "201": [15.8, 62.2],
  "202": [19.3, 56.2],
  "203": [19.3, 62.2],
  "204": [22.9, 56.2],
  "205": [22.9, 62.2],
  "206": [26.4, 56.2],
  "207": [26.4, 62.2],
  "208": [29.9, 56.2],
  "209": [29.9, 62.2],
  "210": [33.4, 56.2],
  "211": [33.4, 62.2],
  "212": [37.0, 56.2],
  "213": [37.0, 62.2],
  "214": [40.5, 56.2],
  "215": [40.5, 62.2],
  "216": [44.0, 56.2],
  "217": [44.0, 62.2],
  "218": [47.6, 56.2],
  "219": [47.6, 62.2],
  "220": [51.1, 56.2],
  "221": [51.1, 62.2],
  "222": [54.6, 56.2],
  "223": [54.6, 62.2],
  "224": [58.2, 56.2],
  "225": [58.2, 62.2],
  "226": [61.7, 56.2],
  "227": [61.7, 62.2],
  "228": [65.2, 56.2],
  "229": [65.2, 62.2],
  "230": [68.7, 56.2],
  "231": [68.7, 62.2],
  "232": [72.3, 56.2],
  "233": [72.3, 62.2],
  "234": [75.8, 56.2],
  "235": [75.8, 62.2],
  "236": [75.8, 51.2],
  "237": [81.8, 51.2],
  "238": [75.8, 48.7],
  "239": [81.8, 48.7],
  "240": [75.8, 46.2],
  "241": [81.8, 46.2],
  "242": [75.8, 43.7],
  "243": [81.8, 43.7],
  "244": [75.8, 41.2],
  "245": [81.8, 41.2],
  "246": [75.8, 38.7],
  "247": [81.8, 38.7],
  "248": [75.8, 36.2],
  "249": [81.8, 36.2],
  "250": [75.8, 33.7],
  "251": [81.8, 33.7],
  "252": [75.8, 31.2],
  "253": [81.8, 31.2],
  "254": [75.8, 28.7],
  "255": [81.8, 28.7],
  "256": [75.8, 26.2],
  "257": [81.8, 26.2],
  "258": [75.8, 23.7],
  "259": [81.8, 23.7],
  "260": [75.8, 21.2],
  "261": [81.8, 21.2],
  "262": [75.8, 18.7],
  "263": [81.8, 18.7],
  "264": [75.8, 16.2],
  "265": [81.8, 16.2],
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

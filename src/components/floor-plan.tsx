import { useMemo, useState } from "react";
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
  vacant_clean: "bg-emerald-500 text-white border-emerald-700",
  vacant_dirty: "bg-amber-400 text-black border-amber-600",
  occupied: "bg-blue-500 text-white border-blue-700",
  occupied_dnd: "bg-purple-600 text-white border-purple-800",
  reserved: "bg-cyan-500 text-black border-cyan-700",
  out_of_order: "bg-rose-600 text-white border-rose-800",
};

/** Status chip config for the stats/filter bar */
const STATUS_CHIP: Record<RoomStatus, { label: string; active: string }> = {
  vacant_clean: { label: "Clean",    active: "bg-emerald-500/25 text-emerald-300 border-emerald-500/50" },
  vacant_dirty: { label: "Dirty",    active: "bg-amber-400/25  text-amber-300  border-amber-400/50" },
  occupied:     { label: "Occupied", active: "bg-blue-500/25   text-blue-300   border-blue-500/50" },
  occupied_dnd: { label: "DND",      active: "bg-purple-600/25 text-purple-300 border-purple-600/50" },
  reserved:     { label: "Reserved", active: "bg-cyan-500/25   text-cyan-300   border-cyan-500/50" },
  out_of_order: { label: "OOO",      active: "bg-rose-600/25   text-rose-300   border-rose-600/50" },
};

/** Two-to-three letter status abbreviation rendered inside each pill */
const STATUS_ABBR: Record<RoomStatus, string> = {
  vacant_clean: "VC",
  vacant_dirty: "VD",
  occupied:     "OCC",
  occupied_dnd: "DND",
  reserved:     "RES",
  out_of_order: "OOO",
};

const STATUS_FILTER_ORDER: RoomStatus[] = [
  "vacant_clean",
  "vacant_dirty",
  "occupied",
  "occupied_dnd",
  "reserved",
  "out_of_order",
];

type Props = {
  floor: FloorView;
  rooms: MapRoom[];
  openRequests?: Map<string, number> | undefined;
  dimmed?: Set<string> | undefined;
  onSelect: (roomId: string) => void;
};

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
 *  │ Lobby │ 201 203 205 207 209 211 213 215 217 219 221 223 225 227 229 233 │ ← floor 2 top row
 *  │ block │ 202 204 206 208 210 212 214 216 218 220 222 224 228 230 232 234 │ ← floor 2 bot row
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
  // ── Lobby-block rooms (100–109) ──────────────────────────────────────────
  "100": [81.0, 10.0],
  "101": [73.0, 10.0],
  "102": [81.0, 13.5],
  "103": [73.0, 13.5],
  "104": [81.0, 17.0],
  "105": [73.0, 17.0],
  "106": [81.0, 20.5],
  "107": [73.0, 20.5],
  "108": [81.0, 24.0],
  "109": [73.0, 24.0],
  // ── West-wing BASE positions (swapped to 136–161 after wing swap) ─────────
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
  // ── North-building BASE positions (swapped to 110–135 after wing swap) ────
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
  // ── Floor 2 rooms ────────────────────────────────────────────────────────
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

// ── Stats / Filter bar ────────────────────────────────────────────────────────

function StatsBar({
  rooms,
  statusFilter,
  onFilter,
}: {
  rooms: MapRoom[];
  statusFilter: RoomStatus | null;
  onFilter: (s: RoomStatus | null) => void;
}) {
  const counts = useMemo(() => {
    const c = {} as Partial<Record<RoomStatus, number>>;
    for (const room of rooms) {
      c[room.status] = (c[room.status] ?? 0) + 1;
    }
    return c;
  }, [rooms]);

  const entries = STATUS_FILTER_ORDER.filter((s) => (counts[s] ?? 0) > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by room status">
      {entries.map((status) => {
        const isActive = statusFilter === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onFilter(isActive ? null : status)}
            aria-pressed={isActive}
            className={[
              "rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all duration-150",
              isActive
                ? `${STATUS_CHIP[status].active} ring-1 ring-white/30 scale-105`
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700",
            ].join(" ")}
          >
            {STATUS_CHIP[status].label}:{" "}
            <span className="font-mono">{counts[status]}</span>
          </button>
        );
      })}
      {statusFilter !== null && (
        <button
          type="button"
          onClick={() => onFilter(null)}
          className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FloorPlan({ floor, rooms, openRequests, dimmed, onSelect }: Props) {
  const [statusFilter, setStatusFilter] = useState<RoomStatus | null>(null);

  const visibleRooms = useMemo(() => filterByFloor(rooms, floor), [rooms, floor]);

  /** Map from room number → 1-based tab index for logical keyboard navigation. */
  const tabIndexByNumber = useMemo(() => {
    const sorted = [...rooms.map((r) => r.number)].sort((a, b) => Number(a) - Number(b));
    return new Map(sorted.map((n, i) => [n, i + 1]));
  }, [rooms]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-2xl">
      {/* HEADER */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span className="font-serif text-sm font-bold text-white tracking-wide">
            Days Inn® Wildwood — Interactive Site Plan
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
            {floor === "both" ? "Floors 1 & 2" : `Floor ${floor}`}
          </span>
        </div>
        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[10px]">
          {(
            [
              ["bg-emerald-500", "Clean"],
              ["bg-amber-400",   "Dirty"],
              ["bg-blue-500",    "Occupied"],
              ["bg-purple-600",  "DND"],
              ["bg-rose-600",    "OOO"],
              ["bg-cyan-500",    "Reserved"],
            ] as const
          ).map(([color, label]) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* STATS / FILTER BAR */}
      <StatsBar
        rooms={visibleRooms}
        statusFilter={statusFilter}
        onFilter={setStatusFilter}
      />

      {/* INTERACTIVE MAP IMAGES */}
      <div className="space-y-8">
        {(floor === "both" ? ([1, 2] as FloorKey[]) : ([floor] as FloorKey[])).map((f) => {
          const floorRooms = filterByFloor(rooms, f);

          return (
            <div key={f} className="space-y-2">
              {floor === "both" && (
                <h3 className="text-sm font-bold tracking-wide text-slate-300 uppercase">
                  Floor {f}
                </h3>
              )}
              <div className="relative w-full overflow-hidden rounded-xl border border-slate-700">
                <img
                  src={propertyMapImage}
                  alt={`Days Inn Wildwood Site Plan - Floor ${f}`}
                  className="block w-full select-none"
                  draggable={false}
                />

                {/* The two physical cells not occupied by the 110–135 range stay visibly unused. */}
                {f !== 2 &&
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

                {/* Overlay room pills at percentage positions */}
                {floorRooms.map((room) => {
                  const coords = ROOM_COORDS[room.number];
                  if (!coords) return null;
                  const [left, top] = coords;
                  const open = openRequests?.get(room.number) ?? 0;
                  const faded =
                    (dimmed?.size ? !dimmed.has(room.number) : false) ||
                    (statusFilter !== null && room.status !== statusFilter);
                  const tabIdx = tabIndexByNumber.get(room.number) ?? 0;

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => onSelect(room.id)}
                      aria-label={`Room ${room.number}: ${room.guest_name ?? "Vacant"}, ${room.status.replace(/_/g, " ")}`}
                      title={`Room ${room.number} · ${room.guest_name ?? "Vacant"} (${room.status.replace(/_/g, " ")})`}
                      tabIndex={tabIdx}
                      style={{ left: `${left}%`, top: `${top}%` }}
                      className={[
                        "absolute -translate-x-1/2 -translate-y-1/2 z-10",
                        "flex flex-col items-center",
                        "rounded border px-1 pt-0.5 pb-px",
                        "shadow-md transition-all duration-100",
                        "hover:scale-[1.4] hover:z-20",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                        PILL_BG[room.status],
                        faded ? "opacity-20 pointer-events-none" : "opacity-90 cursor-pointer",
                      ].join(" ")}
                    >
                      <span className="text-[9px] font-black leading-none font-mono">
                        {room.number}
                      </span>
                      <span className="text-[6px] leading-none opacity-75 tracking-tight">
                        {STATUS_ABBR[room.status]}
                      </span>
                      {open > 0 && (
                        <>
                          {/* Pulsing ring to draw attention to rooms with open requests */}
                          <span className="absolute -top-1.5 -right-1.5 h-3 w-3 animate-ping rounded-full bg-rose-500 opacity-75" />
                          <span className="absolute -top-1.5 -right-1.5 grid h-3 w-3 place-items-center rounded-full bg-rose-600 text-[7px] font-black text-white shadow">
                            {open}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* FALLBACK: rooms without photo coordinates */}
      {(() => {
        const unmapped = visibleRooms.filter((r) => !ROOM_COORDS[r.number]);
        if (!unmapped.length) return null;
        return (
          <div className="mt-4 border-t border-slate-800 pt-3">
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
                  aria-label={`Room ${room.number}: ${room.guest_name ?? "Vacant"}, ${room.status.replace(/_/g, " ")}`}
                  className={`rounded border px-2 py-1 text-[10px] font-bold font-mono shadow transition-all hover:scale-105 ${PILL_BG[room.status]}`}
                >
                  {room.number}
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

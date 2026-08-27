import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import propertyMapImage from "@/assets/property_map_final.png";
import { type FloorKey } from "@/lib/property-layout";
type RoomStatus =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "out_of_order" | "reserved";

export type MapRoom = {
  id: string;
  number: string;
  status: RoomStatus;
  guest_name?: string | null;
};

export type FloorView = FloorKey | "both";

/** Colored translucent blocks mapping to the mockup */
const OVERLAY_BG: Record<RoomStatus, string> = {
  vacant_clean: "bg-emerald-500/60 text-white",
  reserved: "bg-emerald-500/60 text-white",
  vacant_dirty: "bg-amber-400/60 text-black",
  occupied: "bg-rose-500/60 text-white",
  occupied_dnd: "bg-purple-600/60 text-white border-2 border-rose-800",
  out_of_order: "bg-slate-500/60 text-white",
};

/** Solid background colors per status for fallback buttons */
const PILL_BG: Record<RoomStatus, string> = {
  vacant_clean: "bg-emerald-500 text-white border-emerald-700",
  vacant_dirty: "bg-amber-400 text-black border-amber-600",
  occupied: "bg-rose-500 text-white border-rose-700",
  occupied_dnd: "bg-purple-600 text-white border-purple-800",
  reserved: "bg-emerald-500 text-white border-emerald-700",
  out_of_order: "bg-slate-500 text-white border-slate-700",
};

/** Status chip config for the stats/filter bar */
const STATUS_CHIP: Record<RoomStatus, { label: string; active: string }> = {
  vacant_clean: {
    label: "Clean",
    active: "bg-emerald-500/25 text-emerald-300 border-emerald-500/50",
  },
  vacant_dirty: { label: "Dirty", active: "bg-amber-400/25  text-amber-300  border-amber-400/50" },
  occupied: { label: "Occupied", active: "bg-blue-500/25   text-blue-300   border-blue-500/50" },
  occupied_dnd: { label: "DND", active: "bg-purple-600/25 text-purple-300 border-purple-600/50" },
  reserved: { label: "Reserved", active: "bg-cyan-500/25   text-cyan-300   border-cyan-500/50" },
  out_of_order: { label: "OOO", active: "bg-rose-600/25   text-rose-300   border-rose-600/50" },
};

/** Two-to-three letter status abbreviation rendered inside each pill */
const STATUS_ABBR: Record<RoomStatus, string> = {
  vacant_clean: "VC",
  vacant_dirty: "VD",
  occupied: "OCC",
  occupied_dnd: "DND",
  reserved: "RES",
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
  rooms: MapRoom[];
  openRequests?: Map<string, number> | undefined;
  dimmed?: Set<string> | undefined;
  activeRoomId?: string | null | undefined;
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
  return rooms.filter((r: MapRoom) => {
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
    <div
      className="mb-3 flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="Filter by room status"
    >
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
            {STATUS_CHIP[status].label}: <span className="font-mono">{counts[status]}</span>
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

export function FloorPlan({ rooms, openRequests, dimmed, activeRoomId, onSelect }: Props) {
  const [statusFilter, setStatusFilter] = useState<RoomStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFloor, setActiveFloor] = useState<FloorView>(1);

  const visibleRooms = useMemo(() => filterByFloor(rooms, activeFloor), [rooms, activeFloor]);

  const searchLower = searchQuery.trim().toLowerCase();
  const matchesSearch = useMemo(() => {
    if (!searchLower) return null;
    const set = new Set<string>();
    for (const r of visibleRooms) {
      if (
        r.number.includes(searchLower) ||
        (r.guest_name ?? "").toLowerCase().includes(searchLower)
      ) {
        set.add(r.number);
      }
    }
    return set;
  }, [visibleRooms, searchLower]);

  const isFaded = (room: MapRoom) => {
    if (dimmed?.size ? !dimmed.has(room.number) : false) return true;
    if (statusFilter !== null && room.status !== statusFilter) return true;
    if (matchesSearch && !matchesSearch.has(room.number)) return true;
    return false;
  };

  const isHighlighted = (room: MapRoom) => {
    return room.number === activeRoomId || (matchesSearch && matchesSearch.has(room.number));
  };

  /** Map from room number → 1-based tab index for logical keyboard navigation. */
  const tabIndexByNumber = useMemo(() => {
    const sorted = [...rooms.map((r) => r.number)].sort((a, b) => Number(a) - Number(b));
    return new Map(sorted.map((n, i) => [n, i + 1]));
  }, [rooms]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-2xl">
      {/* HEADER */}
      <div className="mb-4 flex flex-col items-center gap-4">
        <h2 className="font-serif text-lg font-bold text-white tracking-wide">
          Days Inn Detailed Property Map
        </h2>

        {/* SEARCH BAR */}
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms, facilities..."
            className="w-full rounded-full border border-slate-700 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder-slate-500 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* FLOOR TOGGLE */}
        <div className="flex w-full max-w-sm rounded-lg border border-slate-700 bg-slate-200 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveFloor(1)}
            aria-pressed={activeFloor === 1}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              activeFloor === 1
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1st Floor
          </button>
          <button
            type="button"
            onClick={() => setActiveFloor(2)}
            aria-pressed={activeFloor === 2}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              activeFloor === 2
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            2nd Floor
          </button>
        </div>
      </div>

      {/* STATS / FILTER BAR */}
      <StatsBar rooms={visibleRooms} statusFilter={statusFilter} onFilter={setStatusFilter} />

      {/* INTERACTIVE MAP IMAGES */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-white">
        <img
          src={propertyMapImage}
          alt={`Days Inn Wildwood Site Plan - Floor ${activeFloor}`}
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

        {/* Overlay room rectangles at percentage positions */}
        {visibleRooms.map((room: MapRoom) => {
          const coords = ROOM_COORDS[room.number];
          if (!coords) return null;
          const [left, top] = coords;
          const open = openRequests?.get(room.number) ?? 0;
          const faded = isFaded(room);
          const highlighted = isHighlighted(room);
          const tabIdx = tabIndexByNumber.get(room.number) ?? 0;
          const isHorizontalWing = left < 70 && top < 29;
          const isVerticalWing = left >= 70 && top >= 29;

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
                "flex items-center justify-center",
                "rounded-sm",
                isHorizontalWing ? "w-[4.2%] h-[4%]" : isVerticalWing ? "w-[3%] h-[3%]" : "w-[4%] h-[3.5%]",
                "transition-all duration-100",
                highlighted ? "hover:scale-[1.1] hover:z-30" : "hover:z-20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                OVERLAY_BG[room.status],
                faded
                  ? "opacity-0 pointer-events-none"
                  : highlighted
                    ? "opacity-100 ring-2 ring-emerald-500 scale-110 z-20"
                    : "opacity-100 cursor-pointer",
              ].join(" ")}
            >
              <span className="text-[10px] font-bold leading-none font-sans drop-shadow-md">
                {room.number}
              </span>
              {open > 0 && (
                <>
                  <span className="absolute -top-1.5 -right-1.5 h-3 w-3 animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="absolute -top-1.5 -right-1.5 grid h-3 w-3 place-items-center rounded-full bg-rose-600 text-[7px] font-black text-white shadow">
                    {open}
                  </span>
                </>
              )}
            </button>
          );
        })}

        {/* BOTTOM RIGHT LEGEND */}
        <div className="absolute bottom-4 right-4 rounded-xl border border-slate-300 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-2 text-xs font-medium text-slate-800">
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-sm" /> Available
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-rose-500 shadow-sm" /> Occupied
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-amber-400 shadow-sm" /> Dirty/Cleaning
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-slate-400 shadow-sm" /> Maintenance
            </span>
          </div>
        </div>
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

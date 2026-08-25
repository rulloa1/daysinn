import { useMemo } from "react";
import type { FloorKey } from "@/lib/property-layout";
import propertyMapImage from "@/assets/property_map.png";

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

/** Filter rooms to the floors the user wants to see */
function filterByFloor(rooms: MapRoom[], floor: FloorView): MapRoom[] {
  if (floor === "both") return rooms;
  return rooms.filter((r) => {
    const n = Number(r.number);
    return floor === 1 ? n < 200 : n >= 200;
  });
}

export function FloorPlan({ floor, rooms, openRequests, dimmed, onSelect }: Props) {
  const byNumber = useMemo(() => {
    const map = new Map<string, MapRoom>();
    for (const room of rooms) map.set(room.number, room);
    return map;
  }, [rooms]);

  const visibleRooms = useMemo(() => filterByFloor(rooms, floor), [rooms, floor]);

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
              ["bg-amber-400", "Dirty"],
              ["bg-blue-500", "Occupied"],
              ["bg-purple-600", "DND"],
              ["bg-rose-600", "OOO"],
              ["bg-cyan-500", "Reserved"],
            ] as const
          ).map(([color, label]) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* INTERACTIVE MAP IMAGE */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-700">
        <img
          src={propertyMapImage}
          alt="Days Inn Wildwood Site Plan"
          className="block w-full select-none"
          draggable={false}
        />

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
                "absolute -translate-x-1/2 -translate-y-1/2 z-10",
                "rounded border px-1 py-0.5 text-[8px] font-black leading-none font-mono",
                "shadow-md transition-all duration-100",
                "hover:scale-[1.4] hover:z-20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                PILL_BG[room.status],
                faded ? "opacity-20" : "opacity-90 cursor-pointer",
              ].join(" ")}
            >
              {room.number}
              {open > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid h-3 w-3 place-items-center rounded-full bg-rose-600 text-[7px] font-black text-white shadow">
                  {open}
                </span>
              )}
            </button>
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

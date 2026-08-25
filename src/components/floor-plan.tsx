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
  "111": [76.5, 39.5],
  "211": [75.5, 40.5],
  "113": [76.5, 42.5],
  "213": [75.5, 43.5],
  "115": [76.5, 45.5],
  "215": [75.5, 46.5],
  "117": [76.5, 48.5],
  "217": [75.5, 49.5],
  "119": [76.5, 54.5],
  "219": [75.5, 55.5],
  "121": [76.5, 57.5],
  "221": [75.5, 58.5],
  "123": [76.5, 60.5],
  "223": [75.5, 61.5],
  "125": [76.5, 63.5],
  "225": [75.5, 64.5],
  "127": [76.5, 66.5],
  "227": [75.5, 67.5],
  "129": [76.5, 69.5],
  "229": [75.5, 70.5],
  "131": [76.5, 72.5],
  "231": [75.5, 73.5],
  "133": [76.5, 75.5],
  "233": [75.5, 76.5],
  "135": [76.5, 78.5],
  "235": [75.5, 79.5],
  "110": [72.5, 39.5],
  "210": [71.5, 40.5],
  "112": [72.5, 42.5],
  "212": [71.5, 43.5],
  "114": [72.5, 45.5],
  "214": [71.5, 46.5],
  "116": [72.5, 48.5],
  "216": [71.5, 49.5],
  "120": [72.5, 54.5],
  "220": [71.5, 55.5],
  "122": [72.5, 57.5],
  "222": [71.5, 58.5],
  "124": [72.5, 60.5],
  "224": [71.5, 61.5],
  "126": [72.5, 63.5],
  "226": [71.5, 64.5],
  "128": [72.5, 66.5],
  "228": [71.5, 67.5],
  "130": [72.5, 69.5],
  "230": [71.5, 70.5],
  "132": [72.5, 72.5],
  "232": [71.5, 73.5],
  "134": [72.5, 75.5],
  "234": [71.5, 76.5],
  "136": [71.0, 16.5],
  "138": [67.5, 16.5],
  "140": [63.9, 16.5],
  "142": [60.4, 16.5],
  "144": [56.8, 16.5],
  "146": [53.3, 16.5],
  "148": [49.7, 16.5],
  "150": [46.2, 16.5],
  "154": [42.6, 16.5],
  "156": [39.1, 16.5],
  "160": [35.5, 16.5],
  "162": [32.0, 16.5],
  "236": [71.0, 17.5],
  "238": [67.5, 17.5],
  "240": [63.9, 17.5],
  "242": [60.4, 17.5],
  "244": [56.8, 17.5],
  "246": [53.3, 17.5],
  "248": [49.7, 17.5],
  "250": [46.2, 17.5],
  "254": [42.6, 17.5],
  "258": [39.1, 17.5],
  "260": [35.5, 17.5],
  "262": [32.0, 17.5],
  "137": [71.0, 19.5],
  "139": [67.5, 19.5],
  "141": [63.9, 19.5],
  "143": [60.4, 19.5],
  "145": [56.8, 19.5],
  "147": [53.3, 19.5],
  "149": [49.7, 19.5],
  "151": [46.2, 19.5],
  "155": [42.6, 19.5],
  "157": [39.1, 19.5],
  "161": [35.5, 19.5],
  "163": [32.0, 19.5],
  "237": [71.0, 20.5],
  "239": [67.8, 20.5],
  "241": [64.5, 20.5],
  "243": [61.2, 20.5],
  "245": [58.0, 20.5],
  "247": [54.8, 20.5],
  "251": [51.5, 20.5],
  "253": [48.2, 20.5],
  "255": [45.0, 20.5],
  "259": [41.8, 20.5],
  "261": [38.5, 20.5],
  "263": [35.2, 20.5],
  "265": [32.0, 20.5],
  "201": [75.5, 18.5],
  "203": [75.5, 22.0],
  "205": [75.5, 25.5],
  "207": [75.5, 29.0],
  "209": [75.5, 32.5],
  "200": [71.5, 18.5],
  "202": [71.5, 22.0],
  "204": [71.5, 25.5],
  "206": [71.5, 29.0],
  "208": [71.5, 32.5],
  "101": [76.5, 36.0],
  "108": [72.5, 36.0],
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
          className="block w-full select-none scale-x-[-1]"
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

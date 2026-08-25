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
  "111": [23.5, 39.5],
  "211": [24.5, 40.5],
  "113": [23.5, 42.5],
  "213": [24.5, 43.5],
  "115": [23.5, 45.5],
  "215": [24.5, 46.5],
  "117": [23.5, 48.5],
  "217": [24.5, 49.5],
  "119": [23.5, 54.5],
  "219": [24.5, 55.5],
  "121": [23.5, 57.5],
  "221": [24.5, 58.5],
  "123": [23.5, 60.5],
  "223": [24.5, 61.5],
  "125": [23.5, 63.5],
  "225": [24.5, 64.5],
  "127": [23.5, 66.5],
  "227": [24.5, 67.5],
  "129": [23.5, 69.5],
  "229": [24.5, 70.5],
  "131": [23.5, 72.5],
  "231": [24.5, 73.5],
  "133": [23.5, 75.5],
  "233": [24.5, 76.5],
  "135": [23.5, 78.5],
  "235": [24.5, 79.5],
  "110": [27.5, 39.5],
  "210": [28.5, 40.5],
  "112": [27.5, 42.5],
  "212": [28.5, 43.5],
  "114": [27.5, 45.5],
  "214": [28.5, 46.5],
  "116": [27.5, 48.5],
  "216": [28.5, 49.5],
  "120": [27.5, 54.5],
  "220": [28.5, 55.5],
  "122": [27.5, 57.5],
  "222": [28.5, 58.5],
  "124": [27.5, 60.5],
  "224": [28.5, 61.5],
  "126": [27.5, 63.5],
  "226": [28.5, 64.5],
  "128": [27.5, 66.5],
  "228": [28.5, 67.5],
  "130": [27.5, 69.5],
  "230": [28.5, 70.5],
  "132": [27.5, 72.5],
  "232": [28.5, 73.5],
  "134": [27.5, 75.5],
  "234": [28.5, 76.5],
  "136": [29.0, 16.5],
  "138": [32.5, 16.5],
  "140": [36.1, 16.5],
  "142": [39.6, 16.5],
  "144": [43.2, 16.5],
  "146": [46.7, 16.5],
  "148": [50.3, 16.5],
  "150": [53.8, 16.5],
  "154": [57.4, 16.5],
  "156": [60.9, 16.5],
  "160": [64.5, 16.5],
  "162": [68.0, 16.5],
  "236": [29.0, 17.5],
  "238": [32.5, 17.5],
  "240": [36.1, 17.5],
  "242": [39.6, 17.5],
  "244": [43.2, 17.5],
  "246": [46.7, 17.5],
  "248": [50.3, 17.5],
  "250": [53.8, 17.5],
  "254": [57.4, 17.5],
  "258": [60.9, 17.5],
  "260": [64.5, 17.5],
  "262": [68.0, 17.5],
  "137": [29.0, 19.5],
  "139": [32.5, 19.5],
  "141": [36.1, 19.5],
  "143": [39.6, 19.5],
  "145": [43.2, 19.5],
  "147": [46.7, 19.5],
  "149": [50.3, 19.5],
  "151": [53.8, 19.5],
  "155": [57.4, 19.5],
  "157": [60.9, 19.5],
  "161": [64.5, 19.5],
  "163": [68.0, 19.5],
  "237": [29.0, 20.5],
  "239": [32.2, 20.5],
  "241": [35.5, 20.5],
  "243": [38.8, 20.5],
  "245": [42.0, 20.5],
  "247": [45.2, 20.5],
  "251": [48.5, 20.5],
  "253": [51.8, 20.5],
  "255": [55.0, 20.5],
  "259": [58.2, 20.5],
  "261": [61.5, 20.5],
  "263": [64.8, 20.5],
  "265": [68.0, 20.5],
  "201": [24.5, 18.5],
  "203": [24.5, 22.0],
  "205": [24.5, 25.5],
  "207": [24.5, 29.0],
  "209": [24.5, 32.5],
  "200": [28.5, 18.5],
  "202": [28.5, 22.0],
  "204": [28.5, 25.5],
  "206": [28.5, 29.0],
  "208": [28.5, 32.5],
  "101": [23.5, 36.0],
  "108": [27.5, 36.0],
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

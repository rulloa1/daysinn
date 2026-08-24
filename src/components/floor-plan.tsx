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
  // ── Lobby / corner block (top-left) ─────────────────────────────────
  // Lobby occupies roughly x:14–22%, y:20–50%

  // ── North Wing — TOP ROW (odd numbers, back-parking side) ────────────
  // Row runs x:22%→85%, y≈17%  (17 cells, step ≈ 3.7%)
  "201": [23.0, 17.0],
  "203": [26.7, 17.0],
  "205": [30.4, 17.0],
  "207": [34.1, 17.0],
  "209": [37.8, 17.0],
  "211": [41.5, 17.0],
  "213": [45.2, 17.0],
  "215": [48.9, 17.0],
  "217": [52.6, 17.0],
  "219": [56.3, 17.0],
  "221": [60.0, 17.0],
  "223": [63.7, 17.0],
  "225": [67.4, 17.0],
  "227": [71.1, 17.0],
  "229": [74.8, 17.0],
  "233": [78.5, 17.0],

  // ── North Wing — BOTTOM ROW (even numbers, courtyard-facing) ─────────
  // Row runs x:22%→85%, y≈24%
  "202": [23.0, 24.5],
  "204": [26.7, 24.5],
  "206": [30.4, 24.5],
  "208": [34.1, 24.5],
  "210": [37.8, 24.5],
  "212": [41.5, 24.5],
  "214": [45.2, 24.5],
  "216": [48.9, 24.5],
  "218": [52.6, 24.5],
  "220": [56.3, 24.5],
  "222": [60.0, 24.5],
  "224": [63.7, 24.5],
  "228": [67.4, 24.5],
  "230": [71.1, 24.5],
  "232": [74.8, 24.5],
  "234": [78.5, 24.5],

  // ── West Wing — LEFT column (odd, side-parking side) ─────────────────
  // Column x≈15.5%, y from 34%→86%  (17 cells, step ≈ 3.2%)
  "101": [15.5, 34.0],
  "103": [15.5, 37.2],
  "105": [15.5, 40.4],
  "107": [15.5, 43.6],
  "109": [15.5, 46.8],
  "111": [15.5, 50.0],
  "113": [15.5, 53.2],
  "115": [15.5, 56.4],
  "117": [15.5, 59.6],
  "119": [15.5, 62.8],
  "121": [15.5, 66.0],
  "123": [15.5, 69.2],
  "125": [15.5, 72.4],
  "127": [15.5, 75.6],
  "129": [15.5, 78.8],
  "131": [15.5, 82.0],
  "133": [15.5, 85.2],

  // ── West Wing — RIGHT column (even, courtyard-facing) ────────────────
  // Column x≈19.5%, same y steps
  "102": [19.5, 34.0],
  "104": [19.5, 37.2],
  "106": [19.5, 40.4],
  "108": [19.5, 43.6],
  "110": [19.5, 46.8],
  "112": [19.5, 50.0],
  "114": [19.5, 53.2],
  "116": [19.5, 56.4],
  "118": [19.5, 59.6],
  "120": [19.5, 62.8],
  "122": [19.5, 66.0],
  "124": [19.5, 69.2],
  "126": [19.5, 72.4],
  "128": [19.5, 75.6],
  "130": [19.5, 78.8],
  "132": [19.5, 82.0],
  "134": [19.5, 85.2],
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

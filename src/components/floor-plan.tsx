import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Crosshair,
  RotateCcw,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Move,
} from "lucide-react";
import { toast } from "sonner";
import { OMITTED_ROOM_NUMBERS, VERIFIED_MAP_LOCATIONS, type FloorKey } from "@/lib/property-layout";
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

const STORAGE_KEY = "daysinn_custom_room_coords_v7";

/** Solid background colors per status for high contrast over the photo */
const PILL_BG: Record<RoomStatus, string> = {
  vacant_clean: "border-emerald-700 bg-emerald-500 text-white",
  vacant_dirty: "border-amber-600 bg-amber-300 text-slate-950",
  occupied: "border-red-800 bg-red-600 text-white",
  occupied_dnd: "border-red-950 bg-red-800 text-white",
  reserved: "border-sky-700 bg-sky-400 text-slate-950",
  out_of_order: "border-slate-500 bg-slate-400 text-slate-950",
};

/** Persistent exterior-stair wayfinding, separate from transient room-status markers. */
const EXTERIOR_STAIR_MARKERS = VERIFIED_MAP_LOCATIONS.filter((location) =>
  location.name.startsWith("Stairs"),
);

type Props = {
  floor: FloorView;
  rooms: MapRoom[];
  openRequests?: Map<string, number> | undefined;
  dimmed?: Set<string> | undefined;
  onFloorChange?: ((floor: FloorView) => void) | undefined;
  onSelect: (roomId: string) => void;
};

/**
 * Base percentage-based [left%, top%] coordinates for each room number.
 * Calibrated precisely against the 3D property map geometry.
 */
const DEFAULT_ROOM_COORDS: Record<string, [number, number]> = {
  // --- Upper Floor (2xx Series) ---
  // Horizontal Front Wing Roof (Left to Right along upper roof plane)
  "200": [14.5, 57.5],
  "201": [14.5, 57.5],
  "202": [17.5, 57.8],
  "203": [17.5, 58.6],
  "204": [20.5, 58.1],
  "205": [20.5, 58.1],
  "206": [23.5, 58.5],
  "207": [23.5, 59.3],
  "208": [26.5, 58.8],
  "209": [26.5, 58.8],
  "210": [29.5, 59.1],
  "211": [29.5, 59.9],
  "212": [33.0, 59.4],
  "213": [33.0, 59.4],
  "214": [36.2, 59.8],
  "215": [36.2, 60.6],
  "216": [39.5, 60.1],
  "217": [39.5, 60.1],
  "218": [43.0, 60.4],
  "219": [43.0, 61.2],
  "220": [46.5, 60.7],
  "221": [46.5, 60.7],
  "222": [49.5, 61.1],
  "223": [49.5, 61.9],
  "224": [52.5, 61.4],
  "225": [52.5, 61.4],
  "226": [55.5, 61.7],
  "227": [55.5, 62.5],
  "228": [58.5, 62.0],
  "229": [58.5, 62.0],
  "230": [61.5, 62.4],
  "231": [61.5, 63.2],
  "232": [64.5, 62.7],
  "233": [64.5, 62.7],
  "234": [67.5, 63.0],
  "235": [67.5, 63.8],

  // Vertical Pool Wing Upper Roof (Even = Courtyard Side, Odd = Parking Side)
  "236": [64.5, 67.0],
  "237": [73.0, 67.0],
  "238": [65.0, 63.0],
  "239": [73.5, 63.0],
  "240": [65.5, 59.0],
  "241": [74.0, 59.0],
  "242": [66.0, 55.0],
  "243": [74.5, 55.0],
  "244": [66.5, 51.0],
  "245": [75.0, 51.0],
  "246": [67.0, 47.0],
  "247": [75.5, 47.0],
  "248": [67.5, 43.0],
  "249": [76.0, 43.0],
  "250": [68.0, 39.0],
  "251": [76.5, 39.0],
  "252": [68.5, 35.0],
  "253": [77.0, 35.0],
  "254": [69.0, 31.0],
  "255": [77.5, 31.0],
  "256": [69.5, 27.0],
  "257": [78.0, 27.0],
  "258": [70.0, 23.0],
  "259": [78.5, 23.0],
  "260": [70.5, 19.0],
  "261": [79.0, 19.0],
  "262": [71.0, 15.0],
  "263": [79.5, 15.0],
  "265": [80.0, 11.0],

  // --- Ground Floor (1xx Series) ---
  // Horizontal Front Wing Ground Walkway (Left to Right along ground doors)
  "100": [14.5, 67.0],
  "101": [14.5, 67.0],
  "102": [17.5, 67.3],
  "103": [17.5, 68.1],
  "104": [20.5, 67.5],
  "105": [20.5, 67.5],
  "106": [23.5, 67.8],
  "107": [23.5, 68.6],
  "108": [26.5, 68.1],
  "109": [26.5, 68.1],
  "110": [29.5, 68.3],
  "111": [29.5, 69.1],
  "112": [33.0, 68.6],
  "113": [33.0, 68.6],
  "114": [36.2, 68.9],
  "115": [36.2, 69.7],
  "116": [39.5, 69.1],
  "117": [39.5, 69.1],
  "118": [43.0, 69.4],
  "119": [43.0, 70.2],
  "120": [46.5, 69.6],
  "121": [46.5, 69.6],
  "122": [49.5, 69.9],
  "123": [49.5, 70.7],
  "124": [52.5, 70.2],
  "125": [52.5, 70.2],
  "126": [55.5, 70.4],
  "127": [55.5, 71.2],
  "128": [58.5, 70.7],
  "129": [58.5, 70.7],
  "130": [61.5, 71.0],
  "131": [61.5, 71.8],
  "132": [64.5, 71.2],
  "133": [64.5, 71.2],
  "134": [67.5, 71.5],
  "135": [67.5, 72.3],

  // Vertical Pool Wing Ground Walkways (Even = Courtyard Side, Odd = Parking Side)
  "136": [63.0, 67.0],
  "137": [74.0, 67.0],
  "138": [63.5, 63.0],
  "139": [74.5, 63.0],
  "140": [64.0, 59.0],
  "141": [75.0, 59.0],
  "142": [64.5, 55.0],
  "143": [75.5, 55.0],
  "144": [65.0, 51.0],
  "145": [76.0, 51.0],
  "146": [65.5, 47.0],
  "147": [76.5, 47.0],
  "148": [66.0, 43.0],
  "149": [77.0, 43.0],
  "150": [66.5, 39.0],
  "151": [77.5, 39.0],
  "152": [67.0, 35.0],
  "153": [78.0, 35.0],
  "154": [67.5, 31.0],
  "155": [78.5, 31.0],
  "156": [68.0, 27.0],
  "157": [79.0, 27.0],
  "158": [68.5, 23.0],
  "159": [79.5, 23.0],
  "160": [69.0, 19.0],
  "161": [80.0, 19.0],
  "162": [69.5, 15.0],
  "163": [80.5, 15.0],
};

function loadStoredCoords(): Record<string, [number, number]> {
  if (typeof window === "undefined") return DEFAULT_ROOM_COORDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ROOM_COORDS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ROOM_COORDS, ...parsed };
  } catch {
    return DEFAULT_ROOM_COORDS;
  }
}

/** Filter rooms to the floors the user wants to see */
function filterByFloor(rooms: MapRoom[], floor: FloorView): MapRoom[] {
  return rooms.filter((r) => {
    if (OMITTED_ROOM_NUMBERS.has(r.number)) return false;
    if (floor === "both") return true;
    const n = Number(r.number);
    return floor === 1 ? n < 200 : n >= 200;
  });
}

export function FloorPlan({ floor, rooms, openRequests, dimmed, onFloorChange, onSelect }: Props) {
  const [localFloor, setLocalFloor] = useState<FloorKey>(floor === "both" ? 1 : floor);
  const [query, setQuery] = useState("");
  const [housekeepingOnly, setHousekeepingOnly] = useState(false);

  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [roomCoords, setRoomCoords] = useState<Record<string, [number, number]>>(loadStoredCoords);
  const [savedCoords, setSavedCoords] =
    useState<Record<string, [number, number]>>(loadStoredCoords);
  const [selectedCalibRoom, setSelectedCalibRoom] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (floor !== "both") setLocalFloor(floor);
  }, [floor]);

  const activeFloor = onFloorChange ? floor : localFloor;
  const normalizedQuery = query.trim().toLowerCase();

  const matchingFacilities = useMemo(
    () =>
      normalizedQuery
        ? VERIFIED_MAP_LOCATIONS.filter((facility) =>
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

  // Set default selected room for calibration
  useEffect(() => {
    const firstVisibleRoom = visibleRooms[0];
    if (isCalibrating && !selectedCalibRoom && firstVisibleRoom) {
      setSelectedCalibRoom(firstVisibleRoom.number);
    }
  }, [isCalibrating, selectedCalibRoom, visibleRooms]);

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

  // Calibration helpers
  const currentCoords = selectedCalibRoom ? roomCoords[selectedCalibRoom] : null;

  function updateRoomPosition(roomNumber: string, left: number, top: number) {
    const clampedLeft = Number(Math.max(1, Math.min(99, left)).toFixed(1));
    const clampedTop = Number(Math.max(1, Math.min(99, top)).toFixed(1));
    setRoomCoords((prev) => ({
      ...prev,
      [roomNumber]: [clampedLeft, clampedTop],
    }));
  }

  function nudge(dx: number, dy: number) {
    if (!selectedCalibRoom) return;
    const current = roomCoords[selectedCalibRoom] ?? [50, 50];
    updateRoomPosition(selectedCalibRoom, current[0] + dx, current[1] + dy);
  }

  function handlePointerDown(roomNumber: string, e: React.PointerEvent) {
    if (!isCalibrating) return;
    e.stopPropagation();
    setSelectedCalibRoom(roomNumber);
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isCalibrating || !isDragging || !selectedCalibRoom || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const leftPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const topPercent = ((e.clientY - rect.top) / rect.height) * 100;
    updateRoomPosition(selectedCalibRoom, leftPercent, topPercent);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  }

  function saveCalibration() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roomCoords));
    }
    setSavedCoords(roomCoords);
    setIsCalibrating(false);
    toast.success("Room positions saved successfully!");
  }

  function cancelCalibration() {
    setRoomCoords(savedCoords);
    setIsCalibrating(false);
    toast.message("Calibration canceled.");
  }

  function resetSelectedRoom() {
    if (!selectedCalibRoom) return;
    const defaultPos = DEFAULT_ROOM_COORDS[selectedCalibRoom];
    if (defaultPos) {
      setRoomCoords((prev) => ({
        ...prev,
        [selectedCalibRoom]: defaultPos,
      }));
      toast.info(`Room ${selectedCalibRoom} reset to default.`);
    } else {
      toast.error(`No default coordinate for room ${selectedCalibRoom}.`);
    }
  }

  function resetAllRooms() {
    setRoomCoords(DEFAULT_ROOM_COORDS);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setSavedCoords(DEFAULT_ROOM_COORDS);
    toast.info("All rooms reset to default coordinates.");
  }

  function copyCoordsJson() {
    const json = JSON.stringify(roomCoords, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Coordinates JSON copied to clipboard!");
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
              {isCalibrating
                ? "Drag room markers onto precise roof-level spots or select a room below."
                : "Tap a room for its live operational details."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isCalibrating) cancelCalibration();
                else setIsCalibrating(true);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                isCalibrating
                  ? "border-amber-500 bg-amber-400 text-slate-950 shadow-sm"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              {isCalibrating ? "Exit Calibration" : "Calibrate Markers"}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
              </span>
              Live status
            </span>
          </div>
        </div>

        {/* Calibration Toolbar */}
        {isCalibrating && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/80 p-3 sm:p-4 text-slate-900 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <span>Room:</span>
                  <select
                    value={selectedCalibRoom}
                    onChange={(e) => setSelectedCalibRoom(e.target.value)}
                    className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {visibleRooms.map((r) => (
                      <option key={r.id} value={r.number}>
                        Room {r.number}
                      </option>
                    ))}
                  </select>
                </label>

                {currentCoords && (
                  <div className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 border border-amber-200">
                    <span>X: {currentCoords[0]}%</span>
                    <span className="text-slate-300">|</span>
                    <span>Y: {currentCoords[1]}%</span>
                  </div>
                )}
              </div>

              {/* Nudge Direction Pad */}
              <div className="flex items-center gap-1 bg-white/80 p-1 rounded-lg border border-amber-200">
                <button
                  type="button"
                  title="Nudge Left"
                  onClick={() => nudge(-0.2, 0)}
                  className="rounded p-1 hover:bg-amber-100 text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    title="Nudge Up"
                    onClick={() => nudge(0, -0.2)}
                    className="rounded p-0.5 hover:bg-amber-100 text-slate-700"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Nudge Down"
                    onClick={() => nudge(0, 0.2)}
                    className="rounded p-0.5 hover:bg-amber-100 text-slate-700"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  title="Nudge Right"
                  onClick={() => nudge(0.2, 0)}
                  className="rounded p-1 hover:bg-amber-100 text-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={resetSelectedRoom}
                  title="Reset selected room to default"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Room
                </button>
                <button
                  type="button"
                  onClick={resetAllRooms}
                  title="Reset all rooms to default"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={copyCoordsJson}
                  title="Copy full JSON"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
                <button
                  type="button"
                  onClick={cancelCalibration}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCalibration}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Save className="h-3 w-3" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

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

      <div className="relative overflow-x-auto bg-slate-800 p-2 sm:p-3 [scrollbar-width:none]">
        <div
          ref={mapContainerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative min-w-[540px] overflow-hidden rounded-2xl border border-slate-700 sm:min-w-full ${
            isCalibrating ? "cursor-crosshair select-none" : ""
          }`}
        >
          <img
            src={propertyMapImage}
            alt="Days Inn Wildwood detailed property map"
            className="block w-full select-none pointer-events-none"
            draggable={false}
          />

          {EXTERIOR_STAIR_MARKERS.map((location) => (
            <div
              key={location.name}
              role="img"
              aria-label={location.name}
              title={location.name}
              style={{ left: `${location.left}%`, top: `${location.top}%` }}
              className="pointer-events-none absolute z-[15] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-white/90 bg-slate-950/95 px-1.5 py-1 text-[8px] font-black uppercase tracking-wide text-white shadow-lg ring-2 ring-slate-950/40 sm:px-2 sm:text-[9px]"
            >
              <span aria-hidden="true" className="flex h-3 items-end gap-px">
                <i className="block h-1 w-1 rounded-t-sm bg-amber-300" />
                <i className="block h-2 w-1 rounded-t-sm bg-amber-300" />
                <i className="block h-3 w-1 rounded-t-sm bg-amber-300" />
              </span>
              <span>Stairs</span>
            </div>
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
            const coords = roomCoords[room.number] ?? DEFAULT_ROOM_COORDS[room.number];
            if (!coords) return null;
            const [left, top] = coords;
            const open = openRequests?.get(room.number) ?? 0;
            const faded = dimmed?.size ? !dimmed.has(room.number) : false;
            const isSelectedForCalib = isCalibrating && selectedCalibRoom === room.number;

            return (
              <button
                key={room.id}
                type="button"
                onPointerDown={(e) => handlePointerDown(room.number, e)}
                onClick={() => {
                  if (isCalibrating) {
                    setSelectedCalibRoom(room.number);
                  } else {
                    onSelect(room.id);
                  }
                }}
                title={`Room ${room.number} · ${room.guest_name ?? "Vacant"} (${room.status.replace(/_/g, " ")})`}
                style={{ left: `${left}%`, top: `${top}%` }}
                className={[
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono font-black leading-none shadow-md transition-transform duration-100",
                  isSelectedForCalib
                    ? "z-40 scale-150 ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 bg-amber-400 text-slate-950 cursor-grab active:cursor-grabbing shadow-2xl"
                    : isCalibrating
                      ? "z-20 cursor-grab hover:scale-125 opacity-90"
                      : "z-10 hover:z-30 hover:scale-[1.45] focus:z-30 focus:scale-[1.45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  !isSelectedForCalib && PILL_BG[room.status],
                  faded && !isCalibrating ? "cursor-default opacity-20" : "opacity-95",
                  "text-[7.5px] sm:text-[8.5px]",
                ].join(" ")}
              >
                {room.number}
                {open > 0 && !isCalibrating && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-950 text-[7px] font-black text-white shadow ring-1 ring-white">
                    {open}
                  </span>
                )}
                {isSelectedForCalib && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-1.5 py-0.5 text-[8px] font-bold text-amber-300 shadow ring-1 ring-white/20">
                    {left}%, {top}%
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
                ["border border-slate-950 bg-amber-300", "Exterior stairs"],
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
        const unmapped = visibleRooms.filter(
          (r) => !roomCoords[r.number] && !DEFAULT_ROOM_COORDS[r.number],
        );
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

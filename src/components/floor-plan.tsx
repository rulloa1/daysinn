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

const STORAGE_KEY = "daysinn_custom_room_coords_v3";

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
 * Calibrated against the 3D property map.
 */
const DEFAULT_ROOM_COORDS: Record<string, [number, number]> = {
  // --- Upper Floor (2xx Series) ---
  // Horizontal Front Wing (Left to Right along roof)
  "200": [14.5, 65.0],
  "201": [14.5, 65.0],
  "202": [17.5, 65.2],
  "203": [17.5, 65.2],
  "204": [20.5, 65.5],
  "205": [20.5, 65.5],
  "206": [23.5, 65.8],
  "207": [23.5, 65.8],
  "208": [26.5, 66.0],
  "209": [26.5, 66.0],
  "210": [29.5, 66.5],
  "211": [29.5, 66.5],
  "212": [33.0, 67.0],
  "213": [33.0, 67.0],
  "214": [36.2, 67.5],
  "215": [36.2, 67.5],
  "216": [39.5, 68.0],
  "217": [39.5, 68.0],
  "218": [44.0, 68.8],
  "219": [44.0, 68.8],
  "220": [48.0, 69.2],
  "221": [48.0, 69.2],
  "222": [48.0, 69.2],
  "223": [51.5, 70.0],
  "224": [51.5, 70.0],
  "225": [53.0, 70.0],
  "226": [53.0, 70.0],
  "227": [51.5, 70.0],
  "228": [53.0, 70.0],
  "229": [55.0, 70.5],
  "230": [56.0, 70.5],
  "231": [58.0, 71.0],
  "232": [59.0, 71.0],
  "233": [61.5, 71.5],
  "234": [59.0, 67.0],
  "235": [64.5, 72.0],

  // Vertical Wing: Inner Courtyard Aisle (Even numbers)
  "236": [57.5, 60.5],
  "238": [57.5, 57.0],
  "240": [57.5, 53.5],
  "242": [57.5, 50.0],
  "244": [57.5, 46.5],
  "246": [57.5, 43.0],
  "248": [57.5, 39.5],
  "250": [57.5, 36.0],
  "252": [57.5, 32.5],
  "254": [57.8, 27.5],
  "256": [57.8, 23.5],
  "258": [57.8, 19.5],
  "260": [58.0, 15.5],
  "262": [58.0, 12.0],
  "264": [58.0, 8.5],
  "266": [63.5, 13.0],
  "268": [63.0, 9.0],
  "270": [67.0, 4.5],
  "272": [71.0, 4.5],

  // Vertical Wing: Outer Parking Aisle (Odd numbers)
  "237": [65.8, 62.0],
  "239": [65.8, 57.0],
  "241": [65.8, 62.0],
  "243": [65.8, 57.0],
  "245": [65.8, 53.0],
  "247": [65.8, 48.5],
  "249": [65.8, 44.5],
  "251": [65.8, 40.5],
  "253": [65.8, 36.5],
  "255": [65.8, 32.5],
  "257": [65.8, 28.5],
  "259": [65.8, 24.5],
  "261": [65.8, 20.5],
  "263": [65.8, 16.5],
  "265": [65.8, 12.5],

  // --- Ground Floor (1xx Series) ---
  // Horizontal Front Wing Ground Walkway
  "100": [14.5, 74.0],
  "101": [14.5, 74.0],
  "102": [17.5, 74.2],
  "103": [17.5, 74.2],
  "104": [20.5, 74.5],
  "105": [20.5, 74.5],
  "106": [23.5, 74.8],
  "107": [23.5, 74.8],
  "108": [26.5, 75.0],
  "109": [26.5, 75.0],
  "110": [29.5, 75.5],
  "111": [29.5, 75.5],
  "112": [33.0, 76.0],
  "113": [33.0, 76.0],
  "114": [36.2, 76.5],
  "115": [36.2, 76.5],
  "116": [39.5, 77.0],
  "117": [39.5, 77.0],
  "118": [44.0, 77.8],
  "119": [44.0, 77.8],
  "120": [48.0, 78.2],
  "121": [48.0, 78.2],
  "122": [48.0, 78.2],
  "123": [51.5, 79.0],
  "124": [51.5, 79.0],
  "125": [53.0, 79.0],
  "126": [53.0, 79.0],
  "127": [51.5, 79.0],
  "128": [53.0, 74.0],
  "129": [55.0, 79.5],
  "130": [56.0, 74.5],
  "131": [58.0, 80.0],
  "132": [59.0, 75.0],
  "133": [61.5, 80.5],
  "134": [59.0, 72.0],
  "135": [64.5, 81.0],

  // Vertical Wing Ground Floor
  "136": [55.5, 60.5],
  "138": [55.5, 57.0],
  "140": [55.5, 53.5],
  "142": [55.5, 50.0],
  "144": [55.5, 46.5],
  "146": [55.5, 43.0],
  "148": [55.5, 39.5],
  "150": [55.5, 36.0],
  "152": [55.5, 32.5],
  "154": [55.8, 27.5],
  "156": [55.8, 23.5],
  "158": [55.8, 19.5],
  "160": [56.0, 15.5],
  "162": [56.0, 12.0],
  "164": [56.0, 8.5],
  "166": [63.5, 15.0],
  "168": [63.0, 11.0],
  "170": [67.0, 6.5],
  "172": [71.0, 6.5],

  "137": [67.8, 62.0],
  "139": [67.8, 57.0],
  "141": [67.8, 62.0],
  "143": [67.8, 57.0],
  "145": [67.8, 53.0],
  "147": [67.8, 48.5],
  "149": [67.8, 44.5],
  "151": [67.8, 40.5],
  "153": [67.8, 36.5],
  "155": [67.8, 32.5],
  "157": [67.8, 28.5],
  "159": [67.8, 24.5],
  "161": [67.8, 20.5],
  "163": [67.8, 16.5],
  "165": [67.8, 12.5],
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

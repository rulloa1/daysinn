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

const STORAGE_KEY = "daysinn_custom_room_coords";

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

/**
 * Base percentage-based [left%, top%] coordinates for each room number.
 */
const DEFAULT_ROOM_COORDS: Record<string, [number, number]> = {
  // Lower horizontal wing (parking lot side)
  "101": [4.5, 68.5],
  "103": [8.8, 69.0],
  "105": [13.0, 69.5],
  "107": [17.5, 70.0],
  "109": [21.8, 70.8],
  "111": [26.2, 71.6],
  "113": [30.5, 72.3],
  "115": [35.0, 73.0],
  "117": [39.2, 73.8],
  "119": [43.5, 74.5],
  "121": [47.8, 75.3],
  "127": [60.8, 77.0],
  "129": [65.2, 77.6],
  "131": [69.5, 78.3],
  "133": [73.8, 79.0],
  "135": [78.2, 79.8],

  // Horizontal wing courtyard/roof side
  "128": [59.8, 63.2],
  "130": [63.8, 63.8],
  "132": [67.8, 64.5],
  "136": [71.8, 65.0],
  "138": [71.5, 61.0],

  // Vertical wing (inner pool/courtyard aisle)
  "140": [71.2, 56.8],
  "142": [71.0, 53.0],
  "144": [70.8, 49.0],
  "146": [70.5, 45.0],
  "148": [70.3, 40.8],
  "150": [70.0, 36.5],
  "152": [69.8, 32.5],
  "154": [69.5, 28.2],
  "156": [69.2, 24.5],
  "158": [68.8, 20.5],
  "160": [68.5, 16.5],
  "162": [68.2, 12.2],
  "164": [68.0, 8.0],

  // Vertical wing (outer parking lot side)
  "137": [82.0, 66.0],
  "139": [81.7, 62.0],
  "141": [81.4, 57.8],
  "143": [81.2, 53.8],
  "145": [80.9, 49.5],
  "147": [80.6, 45.5],
  "149": [80.3, 41.5],
  "151": [80.0, 37.2],

  // Upper floor (2xx series) corresponding positions
  "201": [4.5, 66.5],
  "203": [8.8, 67.0],
  "205": [13.0, 67.5],
  "207": [17.5, 68.0],
  "209": [21.8, 68.8],
  "211": [26.2, 69.6],
  "213": [30.5, 70.3],
  "215": [35.0, 71.0],
  "217": [39.2, 71.8],
  "219": [43.5, 72.5],
  "221": [47.8, 73.3],
  "227": [60.8, 75.0],
  "229": [65.2, 75.6],
  "231": [69.5, 76.3],
  "233": [73.8, 77.0],
  "235": [78.2, 77.8],
  "228": [59.8, 61.2],
  "230": [63.8, 61.8],
  "232": [67.8, 62.5],
  "236": [71.8, 63.0],
  "238": [71.5, 59.0],
  "240": [71.2, 54.8],
  "242": [71.0, 51.0],
  "244": [70.8, 47.0],
  "246": [70.5, 43.0],
  "248": [70.3, 38.8],
  "250": [70.0, 34.5],
  "252": [69.8, 30.5],
  "254": [69.5, 26.2],
  "256": [69.2, 22.5],
  "258": [68.8, 18.5],
  "260": [68.5, 14.5],
  "262": [68.2, 10.2],
  "264": [68.0, 6.0],
  "237": [82.0, 64.0],
  "239": [81.7, 60.0],
  "241": [81.4, 55.8],
  "243": [81.2, 51.8],
  "245": [80.9, 47.5],
  "247": [80.6, 43.5],
  "249": [80.3, 39.5],
  "251": [80.0, 35.2],
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

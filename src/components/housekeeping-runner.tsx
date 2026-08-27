import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Clock,
  Moon,
  BedDouble,
  Wrench,
  CheckCircle2,
  ListOrdered,
  Footprints,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  buildRunnerQueue,
  findNextDirtyRoomIndex,
  getRoomLandmark,
  getRunnerMetrics,
  type RunnerFilter,
  type RunnerRoom,
  type RunnerSortMode,
  type RoomStatus,
} from "@/lib/housekeeping-runner";
import type { StaffIdentity } from "@/lib/ops";

const STATUS_LABEL: Record<RoomStatus, string> = {
  vacant_dirty: "Vacant Dirty",
  occupied: "Occupied",
  occupied_dnd: "Occupied / DND",
  vacant_clean: "Vacant Clean",
  reserved: "Reserved",
  out_of_order: "Out of Order",
};

const STATUS_COLOR: Record<RoomStatus, { border: string; bg: string; text: string; dot: string }> =
  {
    vacant_clean: {
      border: "border-emerald-500/50",
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    vacant_dirty: {
      border: "border-amber-500/60",
      bg: "bg-amber-500/20",
      text: "text-amber-300",
      dot: "bg-amber-400",
    },
    occupied: {
      border: "border-rose-500/50",
      bg: "bg-rose-500/15",
      text: "text-rose-300",
      dot: "bg-rose-400",
    },
    occupied_dnd: {
      border: "border-red-600/70",
      bg: "bg-red-600/25",
      text: "text-red-300",
      dot: "bg-red-500",
    },
    reserved: {
      border: "border-sky-500/50",
      bg: "bg-sky-500/15",
      text: "text-sky-300",
      dot: "bg-sky-400",
    },
    out_of_order: {
      border: "border-slate-500/50",
      bg: "bg-slate-500/20",
      text: "text-slate-300",
      dot: "bg-slate-400",
    },
  };

const QUICK_NOTES = [
  "Linen changed",
  "Towels replenished",
  "Toiletries stocked",
  "Late service requested",
  "Trash emptied",
  "Deep cleaned",
];

type Props = {
  rooms: RunnerRoom[];
  staff: NonNullable<StaffIdentity>;
  canTriage: boolean;
  initialRoomId?: string | null;
  openRequests?: Array<{ id: string; room: string; type: string; details: string | null }>;
  onSetStatus: (room: RunnerRoom, next: RoomStatus) => Promise<void>;
  onSetStage?: (room: RunnerRoom, stage: string | null) => Promise<void>;
  onToggleLinen?: (room: RunnerRoom) => Promise<void>;
  onSaveNotes?: (room: RunnerRoom, notes: string) => Promise<void>;
  onReportIssue?: (room: RunnerRoom) => void;
  onClose: () => void;
};

export function HousekeepingRunner({
  rooms,
  staff,
  canTriage,
  initialRoomId,
  openRequests = [],
  onSetStatus,
  onSetStage,
  onToggleLinen,
  onSaveNotes,
  onReportIssue,
  onClose,
}: Props) {
  const [filter, setFilter] = useState<RunnerFilter>("dirty_only");
  const [sortMode, setSortMode] = useState<RunnerSortMode>("walking_order");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Build the sorted queue based on active filter and sortMode
  const queue = useMemo(
    () => buildRunnerQueue(rooms, filter, sortMode, staff.id),
    [rooms, filter, sortMode, staff.id],
  );

  const metrics = useMemo(() => getRunnerMetrics(rooms), [rooms]);

  // Sync currentIndex to initialRoomId if provided on open
  useEffect(() => {
    if (initialRoomId && queue.length > 0) {
      const found = queue.findIndex((r) => r.id === initialRoomId);
      if (found >= 0) setCurrentIndex(found);
    }
  }, [initialRoomId, queue]);

  // Keep index within bounds when queue length changes
  useEffect(() => {
    if (queue.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= queue.length) {
      setCurrentIndex(queue.length - 1);
    }
  }, [queue.length, currentIndex]);

  const currentRoom = queue[currentIndex] ?? null;
  const landmark = useMemo(
    () => (currentRoom ? getRoomLandmark(currentRoom.number) : null),
    [currentRoom],
  );

  // Sync noteText with current room notes
  useEffect(() => {
    setNoteText(currentRoom?.notes ?? "");
  }, [currentRoom]);

  const roomRequests = useMemo(() => {
    if (!currentRoom) return [];
    return openRequests.filter((req) => req.room === currentRoom.number);
  }, [openRequests, currentRoom]);

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    setCurrentIndex((prev) => (prev < queue.length - 1 ? prev + 1 : 0));
  }, [queue.length]);

  const handlePrev = useCallback(() => {
    if (queue.length === 0) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : queue.length - 1));
  }, [queue.length]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Touch swipe handling
  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.targetTouches[0];
    if (touch) setTouchStart(touch.clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const touchEnd = touch.clientX;
    const diff = touchStart - touchEnd;
    if (diff > 60) {
      handleNext();
    } else if (diff < -60) {
      handlePrev();
    }
    setTouchStart(null);
  }

  // Action: Mark Clean & Next
  async function handleMarkCleanAndNext() {
    if (!currentRoom || actionLoading) return;
    setActionLoading(true);
    try {
      if (onSetStage && currentRoom.hk_stage) {
        await onSetStage(currentRoom, null);
      }
      await onSetStatus(currentRoom, "vacant_clean");

      // Auto-advance to the next dirty room
      const nextIdx = findNextDirtyRoomIndex(queue, currentIndex);
      setCurrentIndex(nextIdx);
    } finally {
      setActionLoading(false);
    }
  }

  // Action: Toggle in-progress stage
  async function handleToggleStage() {
    if (!currentRoom || !onSetStage || actionLoading) return;
    setActionLoading(true);
    try {
      const nextStage = currentRoom.hk_stage === "in_progress" ? null : "in_progress";
      await onSetStage(currentRoom, nextStage);
    } finally {
      setActionLoading(false);
    }
  }

  // Action: Set DND
  async function handleToggleDnd() {
    if (!currentRoom || actionLoading) return;
    setActionLoading(true);
    try {
      const nextStatus = currentRoom.status === "occupied_dnd" ? "occupied" : "occupied_dnd";
      await onSetStatus(currentRoom, nextStatus);
    } finally {
      setActionLoading(false);
    }
  }

  // Action: Add quick note preset
  async function handleAddNotePreset(preset: string) {
    if (!currentRoom || !onSaveNotes) return;
    const existing = (noteText || "").trim();
    const updated = existing ? `${existing} · ${preset}` : preset;
    setNoteText(updated);
    setSavingNote(true);
    try {
      await onSaveNotes(currentRoom, updated);
    } finally {
      setSavingNote(false);
    }
  }

  // Action: Save custom note
  async function handleSaveNote() {
    if (!currentRoom || !onSaveNotes) return;
    setSavingNote(true);
    try {
      await onSaveNotes(currentRoom, noteText.trim());
    } finally {
      setSavingNote(false);
    }
  }

  const color = currentRoom ? STATUS_COLOR[currentRoom.status] : STATUS_COLOR.vacant_clean;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink text-cream select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Housekeeping Runner Mode"
    >
      {/* Top Header & Navigation */}
      <header className="shrink-0 border-b border-cream/15 bg-ink/95 px-3 py-2.5 backdrop-blur-xl sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber text-ink font-bold shrink-0">
              <Footprints className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="signage text-sm font-bold text-cream truncate sm:text-base">
                  Runner Mode
                </h1>
                <span className="signage rounded-full bg-amber/20 px-2 py-0.5 text-[0.65rem] text-amber">
                  {metrics.percentComplete}% Done
                </span>
              </div>
              <p className="text-[0.7rem] text-cream/60 truncate">
                {metrics.cleaned} Clean · {metrics.remainingDirty} Dirty Left · {staff.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortMode((prev) =>
                  prev === "walking_order" ? "priority_dirty_first" : "walking_order",
                )
              }
              className="h-8 border-cream/20 bg-cream/5 text-[0.7rem] text-cream hover:bg-cream/15 hidden min-[480px]:inline-flex items-center gap-1.5"
            >
              <ListOrdered className="h-3.5 w-3.5 text-amber" />
              {sortMode === "walking_order" ? "Walking Order" : "Dirty First"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full border border-cream/20 bg-cream/5 text-cream hover:bg-cream/15 hover:text-white"
              aria-label="Exit runner mode"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
          <div
            className="h-full bg-gradient-to-r from-amber to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${metrics.percentComplete}%` }}
          />
        </div>

        {/* Filter Pills */}
        <div
          className="mt-2.5 flex snap-x gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]"
          role="group"
          aria-label="Runner filter"
        >
          {(
            [
              ["dirty_only", `Dirty (${metrics.remainingDirty})`],
              ["mine", "My Rooms"],
              ["floor_1", "Floor 1"],
              ["floor_2", "Floor 2"],
              ["all", `All (${rooms.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key);
                setCurrentIndex(0);
              }}
              aria-pressed={filter === key}
              className={`signage shrink-0 snap-start rounded-full px-3 py-1 text-[0.65rem] transition-colors duration-150 ${
                filter === key
                  ? "bg-amber font-bold text-ink shadow-sm"
                  : "border border-cream/15 bg-cream/5 text-cream/65 hover:border-cream/35 hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Runner Content Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col justify-between max-w-2xl mx-auto w-full">
        {queue.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center p-8 border border-cream/15 bg-cream/[0.03] rounded-2xl">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
            <h2 className="text-xl font-bold text-cream">No rooms in this view!</h2>
            <p className="mt-1 text-sm text-cream/65 max-w-xs">
              All matching rooms are clean or none were found for the selected filter.
            </p>
            <Button
              onClick={() => {
                setFilter("all");
                setCurrentIndex(0);
              }}
              className="mt-5 bg-amber text-ink font-bold hover:bg-amber/90"
            >
              View All Rooms
            </Button>
          </div>
        ) : currentRoom ? (
          <div className="space-y-4">
            {/* Step Counter & Position Banner */}
            <div className="flex items-center justify-between text-xs text-cream/60">
              <span className="signage font-mono tracking-wider text-amber font-bold">
                ROOM {currentIndex + 1} OF {queue.length}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-cream/40">Step</span>
                <span className="font-semibold text-cream">
                  {Math.round(((currentIndex + 1) / queue.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Hero Room Display Card */}
            <div
              className={`relative overflow-hidden rounded-2xl border-2 p-5 sm:p-6 transition-all duration-200 ${color.border} ${color.bg}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="signage text-xs uppercase tracking-widest text-cream/60">
                    Floor {currentRoom.floor}
                  </span>
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <span className="text-5xl sm:text-6xl font-bold tracking-tight text-white font-mono">
                      {currentRoom.number}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`signage flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${color.border} ${color.bg} ${color.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                    {STATUS_LABEL[currentRoom.status]}
                  </span>

                  {currentRoom.hk_stage ? (
                    <span className="signage rounded-md bg-amber/20 border border-amber/40 px-2 py-0.5 text-[0.65rem] text-amber font-semibold">
                      {currentRoom.hk_stage === "in_progress" ? "In Progress" : "Inspected"}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Physical Wing / Landmark */}
              {landmark ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-cream/80 bg-ink/40 rounded-lg p-2 border border-cream/10">
                  <Footprints className="h-3.5 w-3.5 text-amber shrink-0" />
                  <span className="font-medium text-cream">{landmark.wing}</span>
                  <span className="text-cream/40">·</span>
                  <span className="text-cream/70 truncate">{landmark.landmark}</span>
                </div>
              ) : null}

              {/* DND Alert Banner */}
              {currentRoom.dnd || currentRoom.status === "occupied_dnd" ? (
                <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-red-500/70 bg-red-950/70 p-3 text-red-200">
                  <Moon className="h-5 w-5 text-red-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">DO NOT DISTURB ACTIVE</p>
                    <p className="text-red-300/80 text-[0.7rem]">
                      Guest has requested privacy. Skip or verify before entry.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Stayover vs Checkout Status */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-cream/15 bg-ink/30 p-2.5">
                  <span className="text-[0.65rem] text-cream/50 uppercase signage block">
                    Turn Type
                  </span>
                  <span className="font-semibold text-cream mt-0.5 block">
                    {currentRoom.extended_stay ? "Stayover Service" : "Checkout Full Turn"}
                  </span>
                  <span className="text-[0.65rem] text-cream/55 mt-0.5 block">
                    {currentRoom.check_out ? `Check out: ${currentRoom.check_out}` : "Standard"}
                  </span>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onToggleLinen && void onToggleLinen(currentRoom)}
                  className={`rounded-lg border p-2.5 cursor-pointer transition-colors ${
                    currentRoom.linen_change
                      ? "border-amber/50 bg-amber/15 text-amber"
                      : "border-cream/15 bg-ink/30 text-cream/70 hover:border-cream/30"
                  }`}
                >
                  <span className="text-[0.65rem] text-cream/50 uppercase signage flex items-center justify-between">
                    Linen Change
                    <BedDouble className="h-3 w-3" />
                  </span>
                  <span className="font-semibold mt-0.5 block text-cream">
                    {currentRoom.linen_change ? "Change Required" : "Standard Refresh"}
                  </span>
                  <span className="text-[0.65rem] text-amber/80 mt-0.5 block">
                    Tap to toggle flag
                  </span>
                </div>
              </div>

              {/* Open Guest Requests */}
              {roomRequests.length > 0 ? (
                <div className="mt-3 rounded-xl border border-sky-500/50 bg-sky-950/40 p-3 text-sky-200">
                  <div className="flex items-center gap-2 font-semibold text-xs text-sky-300">
                    <Bell className="h-4 w-4 text-sky-400" />
                    <span>Open Guest Requests ({roomRequests.length})</span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-xs">
                    {roomRequests.map((req) => (
                      <li
                        key={req.id}
                        className="text-[0.75rem] text-sky-100 flex items-start gap-1.5"
                      >
                        <span className="text-sky-400 font-bold">•</span>
                        <span>
                          <strong className="capitalize">{req.type}:</strong>{" "}
                          {req.details || "No additional details"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Quick Notes Presets */}
              <div className="mt-3">
                <span className="text-[0.65rem] text-cream/50 uppercase signage block mb-1.5">
                  Quick Room Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => void handleAddNotePreset(preset)}
                      className="signage rounded-md border border-cream/20 bg-ink/40 px-2 py-1 text-[0.65rem] text-cream/75 transition-colors hover:border-amber hover:text-amber"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Notes Field */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[0.65rem] text-cream/50 uppercase signage">Room Notes</span>
                  {savingNote ? (
                    <span className="text-[0.65rem] text-amber flex items-center gap-1">
                      <Clock className="h-3 w-3 animate-spin" /> Saving…
                    </span>
                  ) : null}
                </div>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onBlur={() => void handleSaveNote()}
                  placeholder="Type any observations or cart notes here…"
                  rows={2}
                  className="w-full border-cream/20 bg-ink/60 text-xs text-cream placeholder:text-cream/35 resize-none focus:border-amber"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Bottom Sticky Action Bar */}
        <div className="mt-4 space-y-2.5">
          {/* Primary Action Button: Large Mark Clean & Next */}
          <Button
            type="button"
            disabled={!currentRoom || actionLoading || !canTriage}
            onClick={() => void handleMarkCleanAndNext()}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="h-5 w-5" />
            <span>Mark Clean & Next Room</span>
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>

          {/* Secondary Action Row (One-Thumb Quick Controls) */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!currentRoom || actionLoading || !canTriage}
              onClick={() => void handleToggleStage()}
              className={`h-11 border-cream/20 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                currentRoom?.hk_stage === "in_progress"
                  ? "bg-amber text-ink border-amber font-bold"
                  : "bg-cream/5 text-cream hover:bg-cream/10"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>
                {currentRoom?.hk_stage === "in_progress" ? "In Progress" : "Start Cleaning"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!currentRoom || actionLoading || !canTriage}
              onClick={() => void handleToggleDnd()}
              className={`h-11 border-cream/20 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                currentRoom?.status === "occupied_dnd"
                  ? "bg-red-600 text-white border-red-500 font-bold"
                  : "bg-cream/5 text-cream hover:bg-cream/10"
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>{currentRoom?.status === "occupied_dnd" ? "Clear DND" : "Set DND"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!currentRoom || !onReportIssue}
              onClick={() => currentRoom && onReportIssue && onReportIssue(currentRoom)}
              className="h-11 border-cream/20 bg-cream/5 text-cream hover:bg-cream/10 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
            >
              <Wrench className="h-3.5 w-3.5 text-amber" />
              <span>Report Issue</span>
            </Button>
          </div>

          {/* Navigation Arrows & Room Scrubber Strip */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrev}
              disabled={queue.length <= 1}
              className="h-9 px-3 rounded-lg border border-cream/15 bg-cream/5 text-cream hover:bg-cream/15 text-xs flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </Button>

            {/* Quick Room Scrubber Strip */}
            <div
              className="flex-1 flex snap-x gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:none]"
              role="group"
              aria-label="Jump to room"
            >
              {queue.map((room, idx) => {
                const isCurrent = idx === currentIndex;
                const isClean = room.status === "vacant_clean";
                const isDirty = room.status === "vacant_dirty";
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Jump to room ${room.number}`}
                    className={`signage shrink-0 snap-center rounded-md px-2 py-1 text-[0.65rem] font-mono transition-all ${
                      isCurrent
                        ? "bg-amber text-ink font-bold ring-2 ring-cream shadow-md"
                        : isClean
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : isDirty
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-cream/5 text-cream/60 border border-cream/10"
                    }`}
                  >
                    {room.number}
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={handleNext}
              disabled={queue.length <= 1}
              className="h-9 px-3 rounded-lg border border-cream/15 bg-cream/5 text-cream hover:bg-cream/15 text-xs flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

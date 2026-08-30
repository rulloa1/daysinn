import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Footprints,
  Map as MapIcon,
  Wrench,
  Clock,
  Sparkles,
  WifiOff,
  ChevronRight,
  Plus,
  Printer,
  Moon,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { useStaffRole } from "@/hooks/use-staff-role";
import { ScreenDenied } from "@/components/ops/screen-guard";
import { canViewScreen } from "@/lib/screen-access";
import { HousekeeperLogin } from "@/components/housekeeping/housekeeper-login";
import { useHousekeepingBoard } from "@/components/housekeeping/use-housekeeping-board";
import { FloorPlan } from "@/components/floor-plan";
import { MaintenanceTicketsPanel } from "@/components/maintenance-tickets-panel";
import { IssueDialog } from "@/components/housekeeping/issue-dialog";
import { RoomDetailDialog } from "@/components/housekeeping/room-detail-dialog";
import { RoomSyncBanner } from "@/components/room-sync-banner";
import { ShiftStart } from "@/components/housekeeping/shift-start";
import { NavRail } from "@/components/front-desk/nav-rail";
import { OpsScreenSwitcher } from "@/components/ops/screen-switcher";
import { toast } from "sonner";
import type { StaffIdentity } from "@/lib/ops";
import type { RoomRow } from "@/components/housekeeping/types";

export const Route = createFileRoute("/housekeeping")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Housekeeping Workspace — Days Inn Hub" },
      {
        name: "description",
        content:
          "Mobile-first housekeeping route and supervisor turn plan for Days Inn Wildwood I-75.",
      },
      { property: "og:title", content: "Housekeeping Workspace — Days Inn Hub" },
      {
        property: "og:description",
        content: "One room at a time on mobile, supervisor turn plan on tablet.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HousekeepingPage,
});

function HousekeepingPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const { roles, loading: roleLoading } = useStaffRole();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#a8b7ca] text-sm text-slate-600">
        Loading Housekeeping…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#00243F] px-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-md">
          <BrandLockup tone="cream" />
          <h1 className="mt-8 font-serif text-3xl font-bold">Housekeeping</h1>
          <p className="mt-2 text-sm text-white/70">
            Sign in with your property staff account to open your route.
          </p>
          <Button
            asChild
            className="mt-6 w-full bg-[#D4AF37] font-bold text-[#004986] hover:bg-[#D4AF37]/90"
          >
            <Link to="/staff">Go to staff sign in</Link>
          </Button>
          <Link
            to="/"
            className="mt-6 inline-block text-xs font-semibold tracking-wider text-white/60 uppercase transition hover:text-[#D4AF37]"
          >
            ← Guest view
          </Link>
        </div>
      </div>
    );
  }

  // Signed in, but viewers (and accounts with no role yet) get no room data.
  if (!canViewScreen(roles, "housekeeping")) {
    return <ScreenDenied screen="housekeeping" suggestion={null} />;
  }

  return <HousekeepingFlow />;
}

function HousekeepingFlow() {
  const {
    members,
    staff,
    select,
    error: rosterError,
  } = useStaffIdentity({
    department: "housekeeping",
    storageKey: "daysinn.housekeeping.identity",
  });

  if (!staff) {
    return <HousekeeperLogin members={members} onSelect={select} rosterError={rosterError} />;
  }

  return <HousekeepingWorkspace staff={staff} onSignOut={() => select(null)} />;
}


type MobileTab = "route" | "map" | "issues" | "shift";

const ROUTE_FILTERS = [
  { key: "todo", label: "To do" },
  { key: "mine", label: "Mine" },
  { key: "dnd", label: "DND" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
] as const;

type RouteFilter = (typeof ROUTE_FILTERS)[number]["key"];

/** Lower sorts first: what a cart should hit next. */
function routeWeight(room: RoomRow, staffId: string | null) {
  const mine = staffId && room.assigned_staff_id === staffId ? 0 : 40;
  if (room.hk_stage === "in_progress") return mine + 0;
  if (room.status === "vacant_dirty") return mine + 1;
  if (room.status === "occupied") return mine + 2;
  if (room.status === "occupied_dnd" || room.dnd) return mine + 6;
  if (room.status === "vacant_clean") return mine + 8;
  return mine + 5;
}

function statusChip(room: RoomRow) {
  if (room.hk_stage === "in_progress")
    return { label: "Cleaning", cls: "bg-[#E4F2F5] text-[#0E7490]", bar: "bg-[#0E7490]" };
  if (room.status === "vacant_clean")
    return { label: "Ready", cls: "bg-[#E7F4EE] text-[#0F7B4F]", bar: "bg-[#0F7B4F]" };
  if (room.dnd || room.status === "occupied_dnd")
    return { label: "DND", cls: "bg-[#F1EAFC] text-[#7C3AED]", bar: "bg-[#7C3AED]" };
  if (room.status === "out_of_order")
    return { label: "Out of order", cls: "bg-slate-100 text-slate-500", bar: "bg-slate-400" };
  if (room.status === "occupied")
    return { label: "Stay", cls: "bg-[#E5F0F9] text-[#0065AB]", bar: "bg-[#0065AB]" };
  return { label: "Turn", cls: "bg-[#FBF0E2] text-[#B45309]", bar: "bg-[#B45309]" };
}

function HousekeepingWorkspace({
  staff,
  onSignOut,
}: {
  staff: NonNullable<StaffIdentity>;
  onSignOut: () => void;
}) {
  const board = useHousekeepingBoard(staff, "all", "");
  const [mobileTab, setMobileTab] = useState<MobileTab>("route");
  const [activeRoom, setActiveRoom] = useState<RoomRow | null>(null);
  const [issueRoom, setIssueRoom] = useState<RoomRow | null>(null);
  const [mapFloor, setMapFloor] = useState<1 | 2 | "both">(1);
  const [routeFilter, setRouteFilter] = useState<RouteFilter>("todo");
  const [query, setQuery] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);

  // The phone flow opens on the shift hand-off screen once per person per day,
  // so a housekeeper confirms their sheet before the route view takes over.
  const shiftKey = `daysinn.hk.shiftStarted.${staff.id}.${new Date().toDateString()}`;
  const [shiftStarted, setShiftStarted] = useState(true);
  useEffect(() => {
    setShiftStarted(window.localStorage.getItem(shiftKey) === "1");
  }, [shiftKey]);

  const staffId = staff.id ?? null;

  const assignedRooms = useMemo(
    () => board.rooms.filter((r) => r.assigned_staff_id === staffId),
    [board.rooms, staffId],
  );
  const claimableRooms = useMemo(
    () => board.rooms.filter((r) => !r.assigned_staff_id && r.status === "vacant_dirty"),
    [board.rooms],
  );

  // My route: assigned rooms when there are any, otherwise the open turns.
  const routeRooms = useMemo(() => {
    const base = assignedRooms.length ? assignedRooms : board.rooms;
    return [...base].sort(
      (a, b) => routeWeight(a, staffId) - routeWeight(b, staffId) || a.number.localeCompare(b.number),
    );
  }, [assignedRooms, board.rooms, staffId]);

  const nextRoom = useMemo(
    () =>
      routeRooms.find(
        (r) =>
          !skipped.includes(r.id) &&
          (r.hk_stage === "in_progress" ||
            r.status === "vacant_dirty" ||
            r.status === "occupied"),
      ) ?? null,
    [routeRooms, skipped],
  );

  const visibleRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routeRooms.filter((room) => {
      if (q && !room.number.toLowerCase().includes(q)) return false;
      switch (routeFilter) {
        case "mine":
          return room.assigned_staff_id === staffId;
        case "todo":
          return room.status === "vacant_dirty" || room.hk_stage === "in_progress";
        case "dnd":
          return room.dnd || room.status === "occupied_dnd";
        case "done":
          return room.status === "vacant_clean";
        default:
          return true;
      }
    });
  }, [routeRooms, routeFilter, query, staffId]);

  const initials = staff.name
    ? staff.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HK";

  const myDone = assignedRooms.filter((r) => r.status === "vacant_clean").length;
  const myTotal = assignedRooms.length;
  const cleanCount = board.rooms.filter((r) => r.status === "vacant_clean").length;
  const totalCount = board.rooms.length;
  const turnCount = board.rooms.filter((r) => r.status === "vacant_dirty").length;
  const dndCount = board.rooms.filter((r) => r.dnd || r.status === "occupied_dnd").length;
  const progressPct = myTotal
    ? Math.round((myDone / myTotal) * 100)
    : totalCount
      ? Math.round((cleanCount / totalCount) * 100)
      : 0;

  const nextChip = nextRoom ? statusChip(nextRoom) : null;
  const inProgress = nextRoom?.hk_stage === "in_progress";

  // Supervisor view data, grouped from the live board instead of samples.
  const unassigned = useMemo(
    () => board.rooms.filter((r) => !r.assigned_staff_id && r.status === "vacant_dirty"),
    [board.rooms],
  );
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; rooms: RoomRow[] }>();
    for (const room of board.rooms) {
      if (!room.assigned_staff_id) continue;
      const key = room.assigned_staff_id;
      const entry = map.get(key) ?? { name: room.assigned_name || "Unnamed", rooms: [] };
      entry.rooms.push(room);
      map.set(key, entry);
    }
    return [...map.entries()]
      .map(([id, entry]) => {
        const done = entry.rooms.filter((r) => r.status === "vacant_clean").length;
        return {
          id,
          name: entry.name,
          done,
          total: entry.rooms.length,
          pct: entry.rooms.length ? Math.round((done / entry.rooms.length) * 100) : 0,
          rooms: [...entry.rooms].sort((a, b) => a.number.localeCompare(b.number)),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [board.rooms]);

  return (
    <div className="ops-portal flex min-h-screen">
      {/* Desktop Navigation Rail for >= 1024px */}
      <NavRail current="rooms" staff={staff} />

      <main className="flex-1 overflow-y-auto pb-28 lg:pb-10">
        <div className="hidden md:block">
          <OpsScreenSwitcher current="housekeeping" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
          <RoomSyncBanner
            summary={board.syncSummary}
            onRetry={board.flushQueuedRoomStatusChanges}
          />

          {/* ============================================================ */}
          {/* MOBILE PHONE ROUTE VIEW (< 1024px) */}
          {/* ============================================================ */}
          <div className="block lg:hidden">
            {!shiftStarted ? (
              <ShiftStart
                staffName={staff.name}
                assigned={assignedRooms}
                claimable={claimableRooms}
                onToggleClaim={(room, toMe) => void board.setAssignment(room, toMe)}
                onStart={() => {
                  window.localStorage.setItem(shiftKey, "1");
                  setShiftStarted(true);
                }}
              />
            ) : (
              <>
                {/* Top Mobile Bar */}
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#00243F] px-4 py-3.5 shadow-lg">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D4AF37] font-mono text-xs font-bold text-[#004986]">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-[0.18em] text-[#D4AF37] uppercase">
                        Housekeeping
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold text-white">{staff.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-white/60">
                        {board.syncSummary?.pending ? (
                          <>
                            <WifiOff className="h-3 w-3" /> Saving offline
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Live &amp; synced
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="min-h-[44px] shrink-0 rounded-lg border border-white/25 px-3 text-xs font-semibold text-white/80 transition active:bg-white/10"
                  >
                    Sign out
                  </button>
                </div>

                {/* Mobile Tab Views */}
                {mobileTab === "route" ? (
                  <div className="flex flex-col gap-4">
                    {/* "Do This Next" Hero Card */}
                    {nextRoom ? (
                      <section className="rounded-2xl bg-[#004986] p-5 text-white shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                            Do this next
                          </p>
                          {nextChip ? (
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${nextChip.cls}`}>
                              {nextChip.label}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex items-baseline gap-3">
                          <span className="font-mono text-5xl font-bold tracking-tight">
                            {nextRoom.number}
                          </span>
                          {nextRoom.priority ? (
                            <span className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase">
                              {nextRoom.priority}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-white/80">
                          Floor {nextRoom.floor}
                          {nextRoom.bed_type ? ` · ${nextRoom.bed_type}` : ""}
                          {nextRoom.linen_change ? " · Linen change" : ""}
                          {nextRoom.notes ? ` · ${nextRoom.notes}` : ""}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            if (inProgress) {
                              void board.setStatus(nextRoom, "vacant_clean");
                              void board.setStage(nextRoom, null);
                            } else {
                              void board.setStage(nextRoom, "in_progress");
                            }
                          }}
                          className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-sm font-bold text-[#004986] shadow-sm transition active:scale-[0.99]"
                        >
                          <Sparkles className="h-4 w-4" />
                          {inProgress
                            ? `Finish room ${nextRoom.number}`
                            : `Start room ${nextRoom.number}`}
                        </button>

                        <div className="mt-2.5 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveRoom(nextRoom)}
                            className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/35 text-xs font-semibold text-white transition active:bg-white/10"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setIssueRoom(nextRoom)}
                            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-white/35 text-xs font-semibold text-white transition active:bg-white/10"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Issue
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSkipped((prev) => [...prev, nextRoom.id]);
                              toast.info(`Room ${nextRoom.number} moved down your route.`);
                            }}
                            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-white/35 text-xs font-semibold text-white transition active:bg-white/10"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                            Skip
                          </button>
                        </div>
                      </section>
                    ) : (
                      <section className="rounded-2xl border border-[#CDE7DA] bg-[#E7F4EE] p-5 text-center">
                        <Sparkles className="mx-auto h-6 w-6 text-[#0F7B4F]" />
                        <p className="mt-2 text-sm font-bold text-[#0F7B4F]">
                          Your route is clear
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Nothing waiting on a cart right now. Check the map or flag an issue.
                        </p>
                        {skipped.length ? (
                          <button
                            type="button"
                            onClick={() => setSkipped([])}
                            className="mt-3 min-h-[44px] rounded-xl border border-[#0F7B4F]/30 px-4 text-xs font-bold text-[#0F7B4F]"
                          >
                            Restore {skipped.length} skipped
                          </button>
                        ) : null}
                      </section>
                    )}

                    {/* Your Shift Progress Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between text-xs">
                        <p className="font-bold text-slate-700">
                          {myTotal ? `${myDone} of ${myTotal} of your rooms done` : `${cleanCount} of ${totalCount} rooms ready`}
                        </p>
                        <span className="font-mono text-slate-400">{progressPct}%</span>
                      </div>
                      <div
                        className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-valuenow={progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Shift progress"
                      >
                        <div
                          className="h-full rounded-full bg-[#D4AF37] transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 text-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">To turn</p>
                          <p className="font-mono text-lg font-bold text-[#B45309]">{turnCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Yours left</p>
                          <p className="font-mono text-lg font-bold text-[#004986]">
                            {Math.max(myTotal - myDone, 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">DND</p>
                          <p className="font-mono text-lg font-bold text-[#7C3AED]">{dndCount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Filters + search */}
                    <div className="flex flex-col gap-2">
                      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                        {ROUTE_FILTERS.map((f) => (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => setRouteFilter(f.key)}
                            aria-pressed={routeFilter === f.key}
                            className={`min-h-[38px] shrink-0 rounded-full px-4 text-xs font-bold transition ${
                              routeFilter === f.key
                                ? "bg-[#004986] text-white"
                                : "border border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        inputMode="numeric"
                        placeholder="Find a room number"
                        aria-label="Find a room number"
                        className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#004986] focus:outline-none"
                      />
                    </div>

                    {/* Rest of Your Route */}
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        {assignedRooms.length ? "Your rooms" : "Open rooms"} · {visibleRooms.length}
                      </p>

                      {visibleRooms.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                          No rooms match this filter.
                        </p>
                      ) : null}

                      {visibleRooms.map((room) => {
                        const chip = statusChip(room);
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => setActiveRoom(room)}
                            className="flex min-h-[64px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition active:border-[#004986]"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className={`h-10 w-1.5 shrink-0 rounded-full ${chip.bar}`} />
                              <div className="min-w-0">
                                <span className="font-mono text-lg font-bold text-[#004986]">
                                  {room.number}
                                </span>
                                <p className="truncate text-xs text-slate-500">
                                  {room.notes || `Floor ${room.floor} · ${room.bed_type || "Standard"}`}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${chip.cls}`}
                            >
                              {chip.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : mobileTab === "map" ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <FloorPlan
                      floor={mapFloor}
                      rooms={board.rooms}
                      onFloorChange={setMapFloor}
                      onSelect={(id) => {
                        const r = board.rooms.find((rm) => rm.id === id);
                        if (r) setActiveRoom(r);
                      }}
                    />
                  </div>
                ) : mobileTab === "issues" ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <MaintenanceTicketsPanel
                      reporter={staff.name}
                      reporterStaffId={staff.id ?? null}
                    />
                  </div>
                ) : (
                  /* Shift Tab */
                  <div className="flex flex-col gap-4">
                    <div className="op-card p-5">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Shift summary
                      </p>
                      <h2 className="mt-1 font-serif text-2xl font-bold text-[#004986]">
                        Nice work, {staff.name}
                      </h2>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Rooms turned
                          </p>
                          <p className="font-mono text-xl font-bold text-[#0F7B4F]">{myDone}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Still assigned
                          </p>
                          <p className="font-mono text-xl font-bold text-[#004986]">
                            {Math.max(myTotal - myDone, 0)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Property ready
                          </p>
                          <p className="font-mono text-xl font-bold text-[#004986]">
                            {cleanCount}/{totalCount}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">DND rooms</p>
                          <p className="font-mono text-xl font-bold text-[#7C3AED]">{dndCount}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          window.localStorage.removeItem(shiftKey);
                          onSignOut();
                          toast.success("Clocked out for the shift.");
                        }}
                        className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#004986] text-sm font-bold text-white shadow-sm"
                      >
                        Clock out
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Fixed Bottom Navigation Bar */}
                <nav
                  aria-label="Housekeeping sections"
                  className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur shadow-lg"
                >
                  {(
                    [
                      { key: "route", label: "Route", Icon: Footprints, badge: turnCount },
                      { key: "map", label: "Map", Icon: MapIcon, badge: 0 },
                      { key: "issues", label: "Issues", Icon: Wrench, badge: board.openIssues.length },
                      { key: "shift", label: "Shift", Icon: Clock, badge: 0 },
                    ] as { key: MobileTab; label: string; Icon: typeof Footprints; badge: number }[]
                  ).map(({ key, label, Icon, badge }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMobileTab(key)}
                      aria-current={mobileTab === key ? "page" : undefined}
                      className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase transition ${
                        mobileTab === key ? "text-[#004986]" : "text-slate-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                      {badge > 0 ? (
                        <span className="absolute top-1.5 right-1/2 translate-x-5 rounded-full bg-[#B45309] px-1.5 text-[9px] font-bold text-white">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      ) : null}
                      {mobileTab === key ? (
                        <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-[#D4AF37]" />
                      ) : null}
                    </button>
                  ))}
                </nav>
              </>
            )}
          </div>

          {/* ============================================================ */}
          {/* SUPERVISOR TABLET VIEW (≥ 1024px) */}
          {/* ============================================================ */}
          <div className="hidden flex-col gap-6 lg:flex">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Housekeeping Supervisor · Shift Turn Plan
                </p>
                <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#004986]">
                  Turn Plan
                </h1>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  className="rounded-xl border-slate-300 bg-white text-xs font-semibold text-[#004986] hover:bg-slate-50"
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print sheet
                </Button>
              </div>
            </div>

            {/* Live advisory panel */}
            {unassigned.length ? (
              <section className="rounded-2xl border border-[#E4D9B4] border-l-4 border-l-[#D4AF37] bg-[#FDFBF4] p-5 shadow-xs">
                <p className="text-[11px] font-bold tracking-widest text-[#8A6D1F] uppercase">
                  Needs attention
                </p>
                <h2 className="mt-1 text-base font-bold text-[#004986]">
                  {unassigned.length} dirty {unassigned.length === 1 ? "room has" : "rooms have"} no
                  housekeeper assigned.
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  {unassigned
                    .slice(0, 8)
                    .map((r) => r.number)
                    .join(", ")}
                  {unassigned.length > 8 ? "…" : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unassigned.slice(0, 6).map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setActiveRoom(room)}
                      className="rounded-xl border border-[#D9C88E] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#8A6D1F] hover:bg-[#FDFBF4]"
                    >
                      Assign {room.number}
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-[#CDE7DA] bg-[#E7F4EE] p-5">
                <p className="text-[11px] font-bold tracking-widest text-[#0F7B4F] uppercase">
                  All covered
                </p>
                <h2 className="mt-1 text-base font-bold text-[#004986]">
                  Every dirty room has a housekeeper assigned.
                </h2>
              </section>
            )}

            {/* 4-Column Stat Grid */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <div className="op-card p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Rooms to turn
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#004986]">{turnCount}</p>
                <p className="mt-1.5 text-xs text-slate-500">{unassigned.length} unassigned</p>
              </div>

              <div className="op-card p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  In progress
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#0E7490]">
                  {board.rooms.filter((r) => r.hk_stage === "in_progress").length}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">being cleaned now</p>
              </div>

              <div className="op-card p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  DND / blocked
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#7C3AED]">{dndCount}</p>
                <p className="mt-1.5 text-xs text-slate-500">revisit later in the shift</p>
              </div>

              <div className="op-card p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Ready
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#0F7B4F]">{cleanCount}</p>
                <p className="mt-1.5 text-xs text-slate-500">of {totalCount} rooms</p>
              </div>
            </div>

            {/* Assignments by Housekeeper Cards */}
            <div className="flex flex-col gap-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Assignments by housekeeper
              </p>

              {groups.length === 0 ? (
                <p className="op-card p-6 text-sm text-slate-500">
                  No rooms are assigned yet. Assign rooms from the shift schedule or by opening a
                  room below.
                </p>
              ) : null}

              {groups.map((member) => (
                <div key={member.id} className="op-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-mono text-sm font-bold text-[#004986]">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.total} rooms assigned</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs font-bold text-slate-600">
                        {member.done} / {member.total} ({member.pct}%)
                      </span>
                      <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#D4AF37]"
                          style={{ width: `${member.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {member.rooms.map((room) => {
                      const chip = statusChip(room);
                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setActiveRoom(room)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold shadow-2xs transition hover:border-[#004986] ${chip.cls}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${chip.bar}`} />
                          <span className="font-mono font-bold text-[#004986]">{room.number}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {chip.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Room Detail Dialog */}
      <RoomDetailDialog
        room={activeRoom}
        issues={board.openIssues}
        staff={staff}
        canTriage={board.canTriage}
        onClose={() => setActiveRoom(null)}
        onSetStatus={board.setStatus}
        onSetStage={board.setStage}
        onToggleLinen={board.toggleLinen}
        onSetAssignment={board.setAssignment}
        onReportIssue={(r) => {
          setActiveRoom(null);
          setIssueRoom(r);
        }}
      />

      {/* Issue Ticket Dialog */}
      <IssueDialog room={issueRoom} staff={staff} onClose={() => setIssueRoom(null)} />
    </div>
  );
}

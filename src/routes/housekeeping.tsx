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

function HousekeepingWorkspace({
  staff,
  onSignOut,
}: {
  staff: NonNullable<StaffIdentity>;
  onSignOut: () => void;
}) {
  const board = useHousekeepingBoard(staff, "all", "");
  const [mobileTab, setMobileTab] = useState<"route" | "map" | "issues" | "shift">("route");
  const [activeRoom, setActiveRoom] = useState<RoomRow | null>(null);
  const [issueRoom, setIssueRoom] = useState<RoomRow | null>(null);
  const [mapFloor, setMapFloor] = useState<1 | 2 | "both">(1);

  // The phone flow opens on the shift hand-off screen once per person per day,
  // so a housekeeper confirms their sheet before the route view takes over.
  const shiftKey = `daysinn.hk.shiftStarted.${staff.id}.${new Date().toDateString()}`;
  const [shiftStarted, setShiftStarted] = useState(true);
  useEffect(() => {
    setShiftStarted(window.localStorage.getItem(shiftKey) === "1");
  }, [shiftKey]);

  const assignedRooms = useMemo(
    () => board.rooms.filter((r) => r.assigned_staff_id === staff.id),
    [board.rooms, staff.id],
  );
  const claimableRooms = useMemo(
    () => board.rooms.filter((r) => !r.assigned_staff_id && r.status === "vacant_dirty"),
    [board.rooms],
  );

  // Compute priority room (the "Do this next" room on mobile)
  const nextRoom = useMemo(() => {
    const dirtyRooms = board.rooms.filter((r) => r.status === "vacant_dirty");
    // Priority to arrival rooms first, then lowest number
    return dirtyRooms[0] ?? board.rooms[0] ?? null;
  }, [board.rooms]);

  const initials = staff.name
    ? staff.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HK";

  const cleanCount = board.rooms.filter((r) => r.status === "vacant_clean").length;
  const totalCount = board.rooms.length;
  const progressPct = totalCount ? Math.round((cleanCount / totalCount) * 100) : 0;

  return (
    <div className="ops-portal flex min-h-screen">
      {/* Desktop Navigation Rail for >= 1024px */}
      <NavRail current="rooms" staff={staff} />

      <main className="flex-1 overflow-y-auto pb-20 lg:pb-10">
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
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#D4AF37] font-mono text-xs font-bold text-[#004986]">
                      {initials}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.18em] text-[#D4AF37] uppercase">
                        Guest Hub · Housekeeping
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-white">{staff.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-white/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Online &amp; synced
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="rounded-lg border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10"
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
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                            Do this next
                          </p>
                          <span className="rounded-full bg-[#D4AF37]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                            Front desk priority
                          </span>
                        </div>

                        <div className="mt-3 flex items-baseline gap-3">
                          <span className="font-mono text-5xl font-bold tracking-tight">
                            {nextRoom.number}
                          </span>
                          <span className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase">
                            Guest arriving 4 PM
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-white/80">
                          {nextRoom.bed_type || "1 King bed"} · Linens flagged. Main building, Floor{" "}
                          {nextRoom.floor}.
                        </p>

                        {nextRoom.hk_stage === "in_progress" ? (
                          <p className="mt-2.5 text-[0.82rem] font-bold tabular-nums text-[#D4AF37]">
                            In progress
                          </p>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            if (nextRoom.hk_stage === "in_progress") {
                              void board.setStatus(nextRoom, "vacant_clean");
                              void board.setStage(nextRoom, null);
                            } else {
                              void board.setStage(nextRoom, "in_progress");
                            }
                          }}
                          className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-sm font-bold text-[#004986] shadow-sm transition active:scale-[0.99]"
                        >
                          <Sparkles className="h-4 w-4" />
                          {nextRoom.hk_stage === "in_progress"
                            ? `Finish room ${nextRoom.number}`
                            : `Start room ${nextRoom.number}`}
                        </button>


                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIssueRoom(nextRoom)}
                            className="flex min-h-[42px] items-center justify-center rounded-xl border border-white/35 bg-transparent text-xs font-semibold text-white transition active:bg-white/10"
                          >
                            Flag issue
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.info(`Room ${nextRoom.number} skipped.`)}
                            className="flex min-h-[42px] items-center justify-center rounded-xl border border-white/35 bg-transparent text-xs font-semibold text-white transition active:bg-white/10"
                          >
                            Skip
                          </button>
                        </div>
                      </section>
                    ) : null}

                    {/* Your Shift Progress Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between text-xs">
                        <p className="font-bold text-slate-700">
                          {cleanCount} of {totalCount} done
                        </p>
                        <span className="font-mono text-slate-400">Since 8:00 AM</span>
                      </div>
                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#D4AF37] transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 text-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">To clean</p>
                          <p className="font-mono text-lg font-bold text-[#004986]">
                            {totalCount - cleanCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Yours left
                          </p>
                          <p className="font-mono text-lg font-bold text-[#004986]">
                            {totalCount - cleanCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">DND</p>
                          <p className="font-mono text-lg font-bold text-[#7C3AED]">
                            {board.rooms.filter((r) => r.status.includes("dnd")).length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rest of Your Route */}
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Rest of your route · {board.rooms.length}
                      </p>

                      {board.rooms.map((room) => {
                        const isClean = room.status === "vacant_clean";
                        const isDnd = room.status.includes("dnd");

                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => setActiveRoom(room)}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition hover:border-[#004986]"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`h-9 w-1.5 rounded-full ${
                                  isClean ? "bg-[#0F7B4F]" : isDnd ? "bg-[#7C3AED]" : "bg-[#B45309]"
                                }`}
                              />
                              <div>
                                <span className="font-mono text-lg font-bold text-[#004986]">
                                  {room.number}
                                </span>
                                <p className="text-xs text-slate-500">
                                  {room.notes ||
                                    `Floor ${room.floor} · ${room.bed_type || "Standard"}`}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                isClean
                                  ? "bg-[#E7F4EE] text-[#0F7B4F]"
                                  : isDnd
                                    ? "bg-[#F1EAFC] text-[#7C3AED]"
                                    : "bg-[#FBF0E2] text-[#B45309]"
                              }`}
                            >
                              {isClean ? "Ready" : isDnd ? "DND" : "Turn"}
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
                        Shift Summary
                      </p>
                      <h2 className="mt-1 font-serif text-2xl font-bold text-[#004986]">
                        Nice work, {staff.name}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">8:00 AM – Today on duty</p>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Rooms turned
                          </p>
                          <p className="font-mono text-xl font-bold text-[#0F7B4F]">{cleanCount}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Avg per room
                          </p>
                          <p className="font-mono text-xl font-bold text-[#004986]">34m</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSignOut();
                          toast.success("Clocked out for the shift.");
                        }}
                        className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#004986] text-xs font-bold text-white shadow-sm"
                      >
                        Clock out
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Fixed Bottom Navigation Bar */}
                <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white py-2 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setMobileTab("route")}
                    className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold uppercase transition ${
                      mobileTab === "route" ? "text-[#004986]" : "text-slate-400"
                    }`}
                  >
                    <Footprints className="h-5 w-5" />
                    Route
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("map")}
                    className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold uppercase transition ${
                      mobileTab === "map" ? "text-[#004986]" : "text-slate-400"
                    }`}
                  >
                    <MapIcon className="h-5 w-5" />
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("issues")}
                    className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold uppercase transition ${
                      mobileTab === "issues" ? "text-[#004986]" : "text-slate-400"
                    }`}
                  >
                    <Wrench className="h-5 w-5" />
                    Issues
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("shift")}
                    className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold uppercase transition ${
                      mobileTab === "shift" ? "text-[#004986]" : "text-slate-400"
                    }`}
                  >
                    <Clock className="h-5 w-5" />
                    Shift
                  </button>
                </nav>
              </>
            )}
          </div>

          {/* ============================================================ */}
          {/* SUPERVISOR TABLET VIEW (≥ 1024px) */}
          {/* ============================================================ */}
          <div className="hidden lg:flex flex-col gap-6">
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
                  onClick={() => toast.success("Auto-assigned unassigned rooms by zone.")}
                  className="rounded-xl bg-[#004986] text-xs font-bold text-white shadow-sm hover:bg-[#004986]/90"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Auto-assign 9 rooms
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.info("Printing turn sheet...")}
                  className="rounded-xl border-slate-300 bg-white text-xs font-semibold text-[#004986] hover:bg-slate-50"
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print sheet
                </Button>
              </div>
            </div>

            {/* Light Advisory Panel ("Do This Next" for Supervisor) */}
            <section className="rounded-2xl border border-[#E4D9B4] border-l-4 border-l-[#D4AF37] bg-[#FDFBF4] p-5 shadow-xs">
              <p className="text-[11px] font-bold tracking-widest text-[#8A6D1F] uppercase">
                Supervisor Recommendation
              </p>
              <h2 className="mt-1 text-base font-bold text-[#004986]">
                Room 122 has a 4 PM arrival and no housekeeper assigned.
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Teresa López finishes Room 209 in about 10 minutes and is located in the same
                building.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => toast.success("Assigned Room 122 to Teresa López")}
                  className="rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#004986] shadow-sm hover:bg-[#D4AF37]/90"
                >
                  Assign 122 to Teresa
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Filtering unassigned rooms")}
                  className="rounded-xl border border-[#D9C88E] bg-white px-3.5 py-2 text-xs font-semibold text-[#8A6D1F] hover:bg-[#FDFBF4]"
                >
                  See all unassigned
                </button>
              </div>
            </section>

            {/* 4-Column Stat Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="op-card p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Rooms to turn
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#004986]">
                  {board.rooms.filter((r) => r.status.includes("dirty")).length}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">3 tied to arrivals</p>
              </div>

              <div className="op-card p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Unassigned
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#B45309]">2</p>
                <p className="mt-1.5 text-xs text-slate-500">122 and 119</p>
              </div>

              <div className="op-card p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Avg turnover
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#004986]">38m</p>
                <p className="mt-1.5 text-xs text-emerald-600">target 45m</p>
              </div>

              <div className="op-card p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Done today
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#0F7B4F]">{cleanCount}</p>
                <p className="mt-1.5 text-xs text-slate-500">of {totalCount} planned</p>
              </div>
            </div>

            {/* Assignments by Housekeeper Cards */}
            <div className="flex flex-col gap-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Assignments by housekeeper
              </p>

              {[
                {
                  id: "hk-1",
                  name: "Marisol R.",
                  zone: "Main building · Floor 1",
                  done: 4,
                  total: 11,
                  pct: 36,
                  rooms: [
                    { num: "114", status: "4 PM", color: "#0E7490", tint: "#E4F2F5" },
                    { num: "113", status: "Turn", color: "#B45309", tint: "#FBF0E2" },
                    { num: "121", status: "Stay", color: "#0065AB", tint: "#E5F0F9" },
                    { num: "117", status: "Done", color: "#0F7B4F", tint: "#E7F4EE" },
                    { num: "110", status: "DND", color: "#7C3AED", tint: "#F1EAFC" },
                  ],
                },
                {
                  id: "hk-2",
                  name: "Ana G.",
                  zone: "Main building · Floor 2",
                  done: 7,
                  total: 12,
                  pct: 58,
                  rooms: [
                    { num: "202", status: "Turn", color: "#B45309", tint: "#FBF0E2" },
                    { num: "205", status: "Turn", color: "#B45309", tint: "#FBF0E2" },
                    { num: "201", status: "Done", color: "#0F7B4F", tint: "#E7F4EE" },
                    { num: "206", status: "Done", color: "#0F7B4F", tint: "#E7F4EE" },
                    { num: "209", status: "DND", color: "#7C3AED", tint: "#F1EAFC" },
                  ],
                },
                {
                  id: "hk-3",
                  name: "Teresa L.",
                  zone: "Building 2 · Floors 1–2",
                  done: 9,
                  total: 10,
                  pct: 90,
                  rooms: [
                    { num: "209", status: "Now", color: "#B45309", tint: "#FBF0E2" },
                    { num: "121", status: "Done", color: "#0F7B4F", tint: "#E7F4EE" },
                    { num: "124", status: "Done", color: "#0F7B4F", tint: "#E7F4EE" },
                    { num: "125", status: "Stay", color: "#0065AB", tint: "#E5F0F9" },
                  ],
                },
              ].map((member) => (
                <div key={member.id} className="op-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-mono text-sm font-bold text-[#004986]">
                        {member.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.zone}</p>
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
                    {member.rooms.map((rm, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold shadow-2xs"
                        style={{ backgroundColor: rm.tint }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: rm.color }}
                        />
                        <span className="font-mono font-bold text-[#004986]">{rm.num}</span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: rm.color }}
                        >
                          {rm.status}
                        </span>
                      </span>
                    ))}
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

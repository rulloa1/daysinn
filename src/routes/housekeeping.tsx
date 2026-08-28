import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Footprints } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import type { StaffIdentity } from "@/lib/ops";
import { FloorPlan } from "@/components/floor-plan";
import { HousekeepingRunner } from "@/components/housekeeping-runner";
import { ShiftClock } from "@/components/shift-clock";
import { MySchedule } from "@/components/my-schedule";
import { MaintenanceTicketsPanel } from "@/components/maintenance-tickets-panel";
import { RoomSyncBanner } from "@/components/room-sync-banner";
import { BoardHeader, Stat } from "@/components/housekeeping/board-header";
import { BoardToolbar } from "@/components/housekeeping/board-toolbar";
import { BuildingSection } from "@/components/housekeeping/building-section";
import { HousekeeperLogin } from "@/components/housekeeping/housekeeper-login";
import { IssueDialog } from "@/components/housekeeping/issue-dialog";
import { RoomDetailDialog } from "@/components/housekeeping/room-detail-dialog";
import { useHousekeepingBoard } from "@/components/housekeeping/use-housekeeping-board";
import type { BoardFilter, BoardView, RoomRow } from "@/components/housekeeping/types";

export const Route = createFileRoute("/housekeeping")({
  head: () => ({
    meta: [
      { title: "Housekeeping Board — Days Inn Hub" },
      {
        name: "description",
        content:
          "Housekeeping board: rooms to turn first, do-not-disturb and extended-stay flags, and one-tap mark-as-clean with staff attribution.",
      },
      { property: "og:title", content: "Housekeeping Board — Days Inn Hub" },
      {
        property: "og:description",
        content: "Live room status for housekeeping, sorted by what needs cleaning first.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HousekeepingPage,
});

function HousekeepingPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-cream/60">
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-cream">
        <div className="w-full max-w-sm">
          <BrandLockup tone="cream" />
          <h1 className="mt-8 text-4xl">Housekeeping</h1>
          <p className="mt-2 text-sm text-cream/60">
            Sign in with the property account first, then pick your name.
          </p>
          <Button asChild className="mt-6 w-full bg-amber text-ink hover:bg-amber/90">
            <Link to="/staff">Go to staff sign in</Link>
          </Button>
          <Link
            to="/"
            className="signage mt-6 inline-block text-cream/60 transition-colors duration-200 hover:text-amber"
          >
            ← Guest view
          </Link>
        </div>
      </div>
    );
  }

  return <Housekeeping />;
}

function Housekeeping() {
  const { members, staff, select, addMember } = useStaffIdentity({
    department: "housekeeping",
    storageKey: "daysinn.housekeeping.identity",
  });

  if (!staff) {
    return <HousekeeperLogin members={members} onSelect={select} onAdd={addMember} />;
  }

  return <HousekeepingBoard staff={staff} onSignOut={() => select(null)} />;
}

function HousekeepingBoard({
  staff,
  onSignOut,
}: {
  staff: NonNullable<StaffIdentity>;
  onSignOut: () => void;
}) {
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<BoardView>("grid");
  const [mapFloor, setMapFloor] = useState<1 | 2 | "both">(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [issueRoom, setIssueRoom] = useState<RoomRow | null>(null);

  const board = useHousekeepingBoard(staff, filter, query);
  const active = board.rooms.find((r) => r.id === activeId) ?? null;

  return (
    <div className="ops-surface min-h-screen bg-ink px-3 pb-24 pt-4 text-cream sm:px-6 sm:pb-16 sm:pt-6">
      <BoardHeader staffName={staff.name} onSignOut={onSignOut} />

      {!board.roleLoading && !board.canTriage ? (
        <div className="mt-4 border border-amber/50 bg-amber/10 p-4">
          <p className="signage text-amber">View-only access</p>
          <p className="mt-2 text-sm text-cream/70">
            A manager must grant staff access before you can mark rooms clean.
          </p>
        </div>
      ) : null}

      {staff.id ? (
        <>
          <ShiftClock staff={{ id: staff.id, name: staff.name }} />
          <MySchedule staff={{ id: staff.id, name: staff.name }} supervisor={board.supervisor} />
        </>
      ) : null}

      <MaintenanceTicketsPanel reporter={staff.name} reporterStaffId={staff.id ?? null} />

      <RoomSyncBanner
        summary={board.syncSummary}
        onRetry={board.flushQueuedRoomStatusChanges}
        className="mt-4"
      />

      <section className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Stat label="To clean" value={board.counts.toClean} />
        <Stat label="My rooms left" value={board.counts.mineLeft} />
        <Stat label="Do not disturb" value={board.counts.dnd} />
        <Stat label="Staying over" value={board.counts.stayovers} />
      </section>

      {board.counts.mineTotal ? (
        <div className="mt-3 border border-cream/15 bg-cream/[0.03] px-4 py-3">
          <p className="signage text-cream/50">
            My shift · {board.counts.mineDone}/{board.counts.mineTotal} done
          </p>
          <div className="mt-2 h-1.5 w-full bg-cream/10">
            <div
              className="h-full bg-amber transition-all duration-300"
              style={{
                width: `${Math.round((board.counts.mineDone / board.counts.mineTotal) * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <BoardToolbar
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        view={view}
        onViewChange={setView}
        toCleanCount={board.counts.toClean}
        mineCount={board.counts.mineTotal}
        alerts={board.alerts}
      />

      {view === "runner" ? (
        <HousekeepingRunner
          rooms={board.rooms}
          staff={staff}
          canTriage={board.canTriage}
          initialRoomId={activeId}
          openRequests={board.openIssues}
          onSetStatus={(room, next) => board.setStatus(room as RoomRow, next)}
          onSetStage={(room, stage) => board.setStage(room as RoomRow, stage)}
          onToggleLinen={(room) => board.toggleLinen(room as RoomRow)}
          onSaveNotes={(room, notes) => board.saveNotes(room as RoomRow, notes)}
          onReportIssue={(room) => setIssueRoom(room as RoomRow)}
          onClose={() => setView("grid")}
        />
      ) : null}

      {board.loading ? (
        <p className="mt-8 text-sm text-cream/50">Loading rooms…</p>
      ) : view === "map" ? (
        <div className="mt-6">
          <FloorPlan
            floor={mapFloor}
            rooms={board.rooms}
            onFloorChange={setMapFloor}
            onSelect={(roomId) => setActiveId(roomId)}
          />
        </div>
      ) : board.buildings.length === 0 ? (
        <div className="mt-8 border border-cream/15 bg-cream/[0.03] p-6 text-center">
          <p className="signage text-cream/50">No rooms match</p>
          <p className="mt-2 text-sm text-cream/60">
            Clear the search or switch filters to see the rest of the board.
          </p>
        </div>
      ) : (
        board.buildings.map(({ building, meta, rooms }) => (
          <BuildingSection
            key={building}
            building={building}
            description={meta.description}
            rooms={rooms}
            staffId={staff.id}
            canTriage={board.canTriage}
            onOpen={setActiveId}
            onMarkClean={(room) => void board.setStatus(room, "vacant_clean")}
            onToggleAssignment={(room, toMe) => void board.setAssignment(room, toMe)}
          />
        ))
      )}

      <RoomDetailDialog
        room={active}
        issues={board.openIssues}
        staff={staff}
        canTriage={board.canTriage}
        onClose={() => setActiveId(null)}
        onSetStatus={(room, next) => void board.setStatus(room, next)}
        onSetStage={(room, stage) => void board.setStage(room, stage)}
        onToggleLinen={(room) => void board.toggleLinen(room)}
        onSetAssignment={(room, toMe) => void board.setAssignment(room, toMe)}
        onReportIssue={(room) => {
          setIssueRoom(room);
          setActiveId(null);
        }}
      />

      <IssueDialog room={issueRoom} staff={staff} onClose={() => setIssueRoom(null)} />

      {/* Mobile shortcut into Runner mode, which is the phone-first way to work a floor. */}
      {view !== "runner" ? (
        <button
          type="button"
          onClick={() => setView("runner")}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-amber px-5 py-3.5 font-bold text-ink shadow-2xl transition-all hover:bg-amber/90 active:scale-95 sm:hidden"
          aria-label="Start runner mode"
        >
          <Footprints className="h-5 w-5" />
          <span>Runner ({board.counts.toClean})</span>
        </button>
      ) : null}
    </div>
  );
}

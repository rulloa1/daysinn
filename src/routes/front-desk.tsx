import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import { useStaffRole } from "@/hooks/use-staff-role";
import { formatDuration } from "@/lib/ops";
import { FloorPlan } from "@/components/floor-plan";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { MaintenanceTicketsPanel } from "@/components/maintenance-tickets-panel";
import {
  DB_STATUS_CARD,
  DB_STATUS_DOT,
  DB_STATUS_LABEL,
  DB_STATUS_ORDER,
  type DbRoomStatus,
} from "@/lib/room-model";
import { BoardHeader } from "@/components/front-desk/board-header";
import { BoardSidebar } from "@/components/front-desk/board-sidebar";
import { BookingsLog } from "@/components/front-desk/bookings-log";
import { Stat } from "@/components/front-desk/primitives";
import { RoomList } from "@/components/front-desk/room-list";
import { RoomPanel } from "@/components/front-desk/room-panel";
import { RoomQrDialog } from "@/components/front-desk/room-qr-dialog";
import { RoomSyncBanner } from "@/components/room-sync-banner";
import { useFrontDeskBoard } from "@/components/front-desk/use-front-desk-board";
import type { RoomRow } from "@/components/front-desk/types";

export const Route = createFileRoute("/front-desk")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Front Desk Board — Days Inn Hub" },
      {
        name: "description",
        content:
          "Front desk board: live room status across three floors, arrivals and departures today, bookings log, and open guest requests.",
      },
      { property: "og:title", content: "Front Desk Board — Days Inn Hub" },
      {
        property: "og:description",
        content: "Room status grid, bookings log, and open requests in one shift view.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FrontDeskPage,
});

/**
 * Supplementary panels shown beneath the map. The map itself is no longer one
 * of these — it is always on screen above them.
 */
const DETAIL_VIEWS = [
  { id: "list", label: "Room list" },
  { id: "analytics", label: "Analytics" },
] as const;

type DetailView = (typeof DETAIL_VIEWS)[number]["id"];

function FrontDeskPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const { isFrontDesk, isHousekeeper, loading: roleLoading } = useStaffRole();

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
          <h1 className="mt-8 text-4xl">Front desk</h1>
          <p className="mt-2 text-sm text-cream/60">
            Sign in with your staff account to open the board.
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

  // Housekeeping-only role is restricted from front-desk guest bookings & phone numbers
  if (isHousekeeper && !isFrontDesk) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-cream">
        <div className="w-full max-w-md border border-amber/30 bg-cream/[0.02] p-8 text-center">
          <BrandLockup tone="cream" />
          <p className="signage mt-6 text-amber">Restricted Access</p>
          <h1 className="mt-2 text-2xl font-normal">Housekeeping Portal</h1>
          <p className="mt-3 text-sm text-cream/70">
            The front-desk board and bookings log are reserved for front desk and management. You
            have access to the live room-status dashboard.
          </p>
          <Button asChild className="mt-6 w-full bg-amber text-ink hover:bg-amber/90">
            <Link to="/housekeeping">Open Housekeeping Dashboard</Link>
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

  return <Board />;
}

function Board() {
  const board = useFrontDeskBoard();
  const [filter, setFilter] = useState<"all" | DbRoomStatus>("all");
  const [detail, setDetail] = useState<DetailView>("list");
  const [mapFloor, setMapFloor] = useState<1 | 2 | "both">(1);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [qrRoom, setQrRoom] = useState<RoomRow | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? board.rooms : board.rooms.filter((room) => room.status === filter)),
    [board.rooms, filter],
  );
  const activeRoom = board.rooms.find((r) => r.id === activeRoomId) ?? null;

  return (
    <div className="min-h-screen bg-ink px-4 py-8 text-cream md:px-12">
      <BoardHeader
        members={board.members}
        staff={board.staff}
        onSelectStaff={board.selectStaff}
        onAddMember={board.addMember}
      />

      {!board.roleLoading && !board.canTriage ? (
        <div className="mt-8 border border-amber/50 bg-amber/10 p-5">
          <p className="signage text-amber">View-only access</p>
          <p className="mt-2 text-sm text-cream/70">
            You can watch the board, but a manager must grant you staff access before you can change
            rooms or bookings.
          </p>
        </div>
      ) : null}

      <RoomSyncBanner summary={board.syncSummary} onRetry={board.flushQueuedRoomStatusChanges} />

      {/*
        The property map is the board. It leads the page at full width and stays
        mounted, so calibration and the floor selection survive every status
        filter change and realtime refresh; everything else reads as context
        arranged around it.
      */}
      <section className="mt-8" aria-label="Property map">
        {board.loading ? (
          <div className="grid min-h-[22rem] place-items-center rounded-[1.75rem] border border-cream/15 bg-cream/[0.03]">
            <p className="text-sm text-cream/50">Loading the property map…</p>
          </div>
        ) : (
          <FloorPlan
            floor={mapFloor}
            rooms={board.rooms}
            openRequests={board.openCountByRoom}
            dimmed={filter === "all" ? undefined : new Set(visible.map((r) => r.number))}
            onFloorChange={setMapFloor}
            onSelect={setActiveRoomId}
          />
        )}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Occupancy" value={`${board.occupancy}%`} />
        <Stat label="Arrivals today" value={board.arrivals.length} />
        <Stat label="Departures today" value={board.departures.length} />
        <Stat label="Open requests" value={board.requests.length} />
        <Stat label="Avg turnover today" value={formatDuration(board.avgTurnover)} />
        <Stat label="Avg response today" value={formatDuration(board.avgResponse)} />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {DB_STATUS_ORDER.map((status) => {
          const on = filter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(on ? "all" : status)}
              aria-pressed={on}
              className={`border px-4 py-3 text-left transition-colors duration-200 ${DB_STATUS_CARD[status]} ${on ? "ring-2 ring-amber" : ""}`}
            >
              <p className="signage flex items-center gap-2 text-cream/75">
                <span aria-hidden className={`h-3 w-[3px] ${DB_STATUS_DOT[status]}`} />
                {DB_STATUS_LABEL[status]}
              </p>
              <p className="mt-2 text-3xl">{board.counts[status] ?? 0}</p>
            </button>
          );
        })}
      </section>

      {filter !== "all" ? (
        <button
          type="button"
          onClick={() => setFilter("all")}
          className="signage mt-4 text-amber underline-offset-4 hover:underline"
        >
          Clear filter — showing {DB_STATUS_LABEL[filter]} ({visible.length})
        </button>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {DETAIL_VIEWS.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setDetail(mode.id)}
                aria-pressed={detail === mode.id}
                className={`signage border px-4 py-2 transition-colors duration-200 ${
                  detail === mode.id
                    ? "border-amber bg-amber/15 text-amber"
                    : "border-cream/20 text-cream/55 hover:text-cream"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {board.loading ? (
            <p className="text-sm text-cream/50">Loading the board…</p>
          ) : detail === "analytics" ? (
            <AnalyticsDashboard />
          ) : (
            <RoomList
              rooms={visible}
              openCountByRoom={board.openCountByRoom}
              onSelect={setActiveRoomId}
            />
          )}
        </section>

        <BoardSidebar
          arrivals={board.arrivals}
          departures={board.departures}
          requests={board.requests}
          rooms={board.rooms}
          onSelectRoom={setActiveRoomId}
        />
      </div>

      <BookingsLog
        bookings={board.bookings}
        canEdit={board.canTriage}
        arrivals={board.arrivals}
        departures={board.departures}
      />

      <MaintenanceTicketsPanel
        reporter={board.staff?.name ?? null}
        reporterStaffId={board.staff?.id ?? null}
        canEdit={board.canTriage}
      />

      <RoomPanel
        room={activeRoom}
        canEdit={board.canTriage}
        requests={activeRoom ? (board.requestsByRoom.get(activeRoom.number) ?? []) : []}
        history={activeRoom ? (board.eventsByRoom.get(activeRoom.number) ?? []) : []}
        staff={board.staff}
        onClose={() => setActiveRoomId(null)}
        onSave={board.saveRoom}
        onQr={(room) => {
          setActiveRoomId(null);
          setQrRoom(room);
        }}
      />

      <RoomQrDialog room={qrRoom} onClose={() => setQrRoom(null)} />
    </div>
  );
}

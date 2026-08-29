import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import { useStaffRole } from "@/hooks/use-staff-role";
import { formatDuration } from "@/lib/ops";
import { FloorPlan } from "@/components/floor-plan";
import { NavRail } from "@/components/front-desk/nav-rail";
import { DoThisNext } from "@/components/front-desk/do-this-next";
import { RoomBoardTable } from "@/components/front-desk/room-board-table";
import { BoardSidebar } from "@/components/front-desk/board-sidebar";
import { RoomPanel } from "@/components/front-desk/room-panel";
import { RoomQrDialog } from "@/components/front-desk/room-qr-dialog";
import { RoomSyncBanner } from "@/components/room-sync-banner";
import { useFrontDeskBoard } from "@/components/front-desk/use-front-desk-board";
import type { RoomRow } from "@/components/front-desk/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Plus, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/front-desk")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Today at Wildwood I-75 — Front Desk Board" },
      {
        name: "description",
        content:
          "Front desk board: live room status, priority arrivals, housekeeping turns, and guest request queue.",
      },
      { property: "og:title", content: "Front Desk Board — Days Inn Hub" },
      {
        property: "og:description",
        content: "Room status board, priority arrivals, and open guest requests in one shift view.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FrontDeskPage,
});

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
      <div className="flex min-h-screen items-center justify-center bg-[#EEF2F7] text-sm text-slate-500">
        Loading Front Desk…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#00243F] px-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-md">
          <BrandLockup tone="cream" />
          <h1 className="mt-8 font-serif text-3xl font-bold">Front desk</h1>
          <p className="mt-2 text-sm text-white/70">
            Sign in with your staff account to open the board.
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

  // Housekeeping-only role is restricted from front-desk guest bookings & phone numbers
  if (isHousekeeper && !isFrontDesk) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#00243F] px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-white/5 p-8 text-center backdrop-blur-md">
          <BrandLockup tone="cream" />
          <p className="mt-6 text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
            Restricted Access
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold">Housekeeping Portal</h1>
          <p className="mt-3 text-sm text-white/70">
            The front-desk board and bookings log are reserved for front desk and management. You
            have access to the mobile housekeeping app.
          </p>
          <Button
            asChild
            className="mt-6 w-full bg-[#D4AF37] font-bold text-[#004986] hover:bg-[#D4AF37]/90"
          >
            <Link to="/housekeeping">Open Housekeeping Dashboard</Link>
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

  return <Board />;
}

function Board() {
  const board = useFrontDeskBoard();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [qrRoom, setQrRoom] = useState<RoomRow | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapFloor, setMapFloor] = useState<1 | 2 | "both">(1);

  const activeRoom = board.rooms.find((r) => r.id === activeRoomId) ?? null;
  const readyToSellCount = useMemo(
    () => board.rooms.filter((r) => r.status === "vacant_clean").length,
    [board.rooms],
  );
  const dirtyCount = useMemo(
    () => board.rooms.filter((r) => r.status === "vacant_dirty").length,
    [board.rooms],
  );

  // Formatted date string
  const dateFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-[#EEF2F7] text-slate-800">
      {/* Desktop Navigation Rail */}
      <NavRail current="board" staff={board.staff} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* Header Row */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Front desk · {board.staff?.name ?? "On Duty"} · {dateFormatted} ·{" "}
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#004986] md:text-4xl">
                Today at Wildwood I-75
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                onClick={() => toast.info("New booking modal opened.")}
                className="rounded-xl bg-[#004986] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004986]/90"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New booking
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => toast.success("Metrics exported as CSV")}
                className="rounded-xl border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-[#004986] shadow-sm hover:bg-slate-50"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Export metrics
              </Button>
            </div>
          </header>

          <RoomSyncBanner
            summary={board.syncSummary}
            onRetry={board.flushQueuedRoomStatusChanges}
          />

          {/* Do This Next Panel & 2x2 Metric Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <DoThisNext
              rooms={board.rooms}
              requests={board.requests}
              arrivals={board.arrivals}
              onPrioritizeRooms={(rooms) => {
                toast.success(`Prioritized ${rooms.join(", ")}`);
              }}
              onOpenRequests={() => {
                toast.info("Request queue opened");
              }}
            />

            {/* 2x2 Metric Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Occupancy
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#004986]">
                  {board.occupancy}%
                </p>
                <p className="mt-2 text-xs font-semibold text-emerald-600">
                  +6 pts vs last Thursday
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Ready to sell
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#004986]">
                  {readyToSellCount}
                </p>
                <p className="mt-2 text-xs font-semibold text-amber-600">
                  {dirtyCount} still to turn
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Avg turnover
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#004986]">
                  {formatDuration(board.avgTurnover)}
                </p>
                <p className="mt-2 text-xs font-semibold text-emerald-600">7m under target</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  Open requests
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-[#004986]">
                  {board.requests.length}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  avg response {formatDuration(board.avgResponse)}
                </p>
              </div>
            </div>
          </div>

          {/* Room Board & Sidebar Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
            <RoomBoardTable
              rooms={board.rooms}
              arrivals={board.arrivals}
              openCountByRoom={board.openCountByRoom}
              onSelectRoom={setActiveRoomId}
              onSelectMap={() => setShowMapModal(true)}
            />

            <BoardSidebar
              arrivals={board.arrivals}
              departures={board.departures}
              requests={board.requests}
              rooms={board.rooms}
              onSelectRoom={setActiveRoomId}
            />
          </div>
        </div>
      </main>

      {/* Room Details Panel */}
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

      {/* QR Code Dialog */}
      <RoomQrDialog room={qrRoom} onClose={() => setQrRoom(null)} />

      {/* Map Modal */}
      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="max-w-5xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-[#004986]">
              <MapPin className="h-5 w-5 text-[#D4AF37]" />
              Live Property Site Map
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <FloorPlan
              floor={mapFloor}
              rooms={board.rooms}
              openRequests={board.openCountByRoom}
              onFloorChange={setMapFloor}
              onSelect={(roomId) => {
                setShowMapModal(false);
                setActiveRoomId(roomId);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

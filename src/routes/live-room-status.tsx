import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Clock3, Map as MapIcon, Radio, RefreshCw, Rows3 } from "lucide-react";
import { toast } from "sonner";
import { BrandLockup } from "@/components/brand-lockup";
import { FloorPlan, type FloorView } from "@/components/floor-plan";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

type RoomStatus =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "reserved" | "out_of_order";

type LiveRoom = {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  updated_at: string;
  assigned_name: string | null;
  hk_stage: string | null;
};

const STATUS_ORDER: RoomStatus[] = [
  "vacant_dirty",
  "vacant_clean",
  "occupied",
  "occupied_dnd",
  "reserved",
  "out_of_order",
];

const STATUS_LABEL: Record<RoomStatus, string> = {
  vacant_clean: "Vacant clean",
  vacant_dirty: "Vacant dirty",
  occupied: "Occupied",
  occupied_dnd: "Occupied / DND",
  reserved: "Reserved / arriving",
  out_of_order: "Out of order",
};

const STATUS_STYLE: Record<RoomStatus, string> = {
  vacant_clean: "border-status-clean/55 bg-status-clean/12 text-status-clean",
  vacant_dirty: "border-status-dirty/70 bg-status-dirty/14 text-status-dirty",
  occupied: "border-status-occupied/55 bg-status-occupied/14 text-status-occupied",
  occupied_dnd: "border-status-dnd/70 bg-status-dnd/14 text-status-dnd",
  reserved: "border-status-reserved/55 bg-status-reserved/12 text-status-reserved",
  out_of_order: "border-status-ooo/70 bg-status-ooo/14 text-status-ooo",
};

function relativeTime(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export const Route = createFileRoute("/live-room-status")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live Room Status — Days Inn Hub" },
      {
        name: "description",
        content:
          "A dedicated, live-updating front-desk view of housekeeping room completions and current property status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LiveRoomStatusPage,
});

function LiveRoomStatusPage() {
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
        Loading live room status…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-cream">
        <div className="w-full max-w-sm">
          <BrandLockup tone="cream" />
          <p className="signage mt-8 text-cream/60">Front desk</p>
          <h1 className="mt-2 text-4xl">Live room status</h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/60">
            Sign in with a staff account to monitor housekeeping progress and current room status.
          </p>
          <Button asChild className="mt-6 w-full bg-amber text-ink hover:bg-amber/90">
            <Link to="/staff">Go to staff sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <LiveBoard />;
}

function LiveBoard() {
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [mapFloor, setMapFloor] = useState<FloorView>("both");

  const load = useCallback(async (manual = false) => {
    if (!isSupabaseConfigured) {
      setLoadError("The live data service is not configured.");
      setLoading(false);
      return;
    }

    if (manual) setRefreshing(true);
    const { data, error } = await supabase
      .from("rooms")
      .select("id, number, floor, status, updated_at, assigned_name, hk_stage")
      .order("floor")
      .order("number");

    if (error) {
      setLoadError("Unable to load live room status. Please try again.");
      if (manual) toast.error("Unable to refresh live room status.");
    } else {
      setRooms((data ?? []) as LiveRoom[]);
      setLastRefresh(new Date().toISOString());
      setLoadError(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel("front-desk-live-room-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => void load())
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_status_events" },
        () => void load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const counts = useMemo(
    () =>
      STATUS_ORDER.reduce(
        (summary, status) => ({
          ...summary,
          [status]: rooms.filter((room) => room.status === status).length,
        }),
        {} as Record<RoomStatus, number>,
      ),
    [rooms],
  );

  const completed = useMemo(
    () =>
      rooms
        .filter((room) => room.status === "vacant_clean")
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 8),
    [rooms],
  );

  const handleMapRoomSelect = useCallback(
    (roomId: string) => {
      const room = rooms.find((candidate) => candidate.id === roomId);
      if (!room) return;
      toast.message(`Room ${room.number}`, {
        description: `${STATUS_LABEL[room.status]} · updated ${relativeTime(room.updated_at)}`,
      });
    },
    [rooms],
  );

  const floors = useMemo(() => {
    const grouped = new Map<number, LiveRoom[]>();
    for (const room of rooms) {
      const floor = grouped.get(room.floor) ?? [];
      floor.push(room);
      grouped.set(room.floor, floor);
    }
    return [...grouped.entries()].sort(([left], [right]) => left - right);
  }, [rooms]);

  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-cream md:px-12">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-cream/15 pb-6">
        <div>
          <BrandLockup tone="cream" />
          <p className="signage mt-6 flex items-center gap-2 text-cream/60">
            <Radio className="h-3.5 w-3.5 text-status-clean" />
            Front desk · live feed
          </p>
          <h1 className="mt-3 text-4xl">Live room status</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/60">
            Monitor real-time housekeeping completions, room readiness, and exceptions across the
            property.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/front-desk"
            className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
          >
            Front desk board
          </Link>
          <Link
            to="/housekeeping"
            className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
          >
            Housekeeping
          </Link>
          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            className="border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
            onClick={() => void load(true)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <section
        className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-status-clean/30 bg-status-clean/10 p-4"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-status-clean" aria-hidden />
          <div>
            <p className="signage text-status-clean">Live updates connected</p>
            <p className="mt-1 text-sm text-cream/70">
              Updates made by Housekeeping appear here automatically as room records change.
            </p>
          </div>
        </div>
        {lastRefresh ? (
          <p
            className="flex items-center gap-2 text-xs text-cream/55"
            title={new Date(lastRefresh).toLocaleString()}
          >
            <Clock3 className="h-3.5 w-3.5" /> Refreshed {relativeTime(lastRefresh)}
          </p>
        ) : null}
      </section>

      {loadError ? (
        <section className="mt-6 border border-status-dirty/60 bg-status-dirty/10 p-5">
          <p className="font-medium text-status-dirty">Live data unavailable</p>
          <p className="mt-1 text-sm text-cream/70">{loadError}</p>
        </section>
      ) : null}

      <section className="mt-6 grid gap-3 grid-cols-2 lg:grid-cols-6">
        {STATUS_ORDER.map((status) => (
          <div key={status} className={`border p-4 ${STATUS_STYLE[status]}`}>
            <p className="signage text-cream/70">{STATUS_LABEL[status]}</p>
            <p className="mt-2 text-3xl tabular-nums text-cream">{counts[status] ?? 0}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="signage text-cream/50">Current property view</p>
              <h2 className="mt-1 text-2xl">
                {viewMode === "map" ? "Live property map" : "Every live room"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex overflow-hidden border border-cream/20"
                role="group"
                aria-label="Live room-status view"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  aria-pressed={viewMode === "map"}
                  className={`inline-flex min-h-10 items-center gap-2 px-3 text-xs font-bold transition ${
                    viewMode === "map"
                      ? "bg-amber text-ink"
                      : "bg-transparent text-cream/65 hover:bg-cream/10 hover:text-cream"
                  }`}
                >
                  <MapIcon className="h-4 w-4" />
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  className={`inline-flex min-h-10 items-center gap-2 border-l border-cream/20 px-3 text-xs font-bold transition ${
                    viewMode === "list"
                      ? "bg-amber text-ink"
                      : "bg-transparent text-cream/65 hover:bg-cream/10 hover:text-cream"
                  }`}
                >
                  <Rows3 className="h-4 w-4" />
                  List
                </button>
              </div>
              <p className="text-sm text-cream/50">{rooms.length} rooms</p>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-cream/60">Loading live rooms…</p>
          ) : floors.length === 0 ? (
            <div className="mt-6 border border-dashed border-cream/25 p-8 text-center">
              <p className="font-display text-xl">No live rooms yet</p>
              <p className="mt-2 text-sm text-cream/60">
                Rooms will appear here once they have been added to the operational database.
              </p>
            </div>
          ) : viewMode === "map" ? (
            <div className="mt-5">
              <FloorPlan
                floor={mapFloor}
                rooms={rooms}
                onFloorChange={setMapFloor}
                onSelect={handleMapRoomSelect}
              />
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {floors.map(([floor, floorRooms]) => (
                <section key={floor}>
                  <p className="signage text-cream/55">
                    Floor {floor} · {floorRooms.length} rooms
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {floorRooms.map((room) => (
                      <article key={room.id} className={`border p-3 ${STATUS_STYLE[room.status]}`}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-2xl leading-none text-cream">{room.number}</p>
                          <span
                            className="h-2.5 w-2.5 rounded-full bg-current"
                            aria-label={STATUS_LABEL[room.status]}
                          />
                        </div>
                        <p className="signage mt-3 text-[11px]">{STATUS_LABEL[room.status]}</p>
                        <p className="mt-1 text-xs text-cream/55">
                          Updated {relativeTime(room.updated_at)}
                        </p>
                        {room.hk_stage ? (
                          <p className="mt-2 text-xs text-cream/75">
                            Housekeeping: {room.hk_stage.replace("_", " ")}
                          </p>
                        ) : null}
                        {room.assigned_name ? (
                          <p className="mt-1 truncate text-xs text-cream/55">
                            Assigned to {room.assigned_name}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <aside className="border border-cream/15 bg-cream/[0.03] p-5">
          <p className="signage text-cream/55">Housekeeping completion feed</p>
          <h2 className="mt-1 text-2xl">Recently clean</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/60">
            The latest rooms currently marked vacant clean in the live room table.
          </p>
          <div className="mt-5 space-y-2">
            {completed.length === 0 ? (
              <p className="text-sm text-cream/50">No completed rooms are available yet.</p>
            ) : (
              completed.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between gap-3 border border-status-clean/30 bg-status-clean/10 p-3"
                >
                  <div>
                    <p className="font-display text-xl">Room {room.number}</p>
                    <p className="mt-1 text-xs text-cream/60">
                      {room.assigned_name ? `Completed by ${room.assigned_name}` : "Status updated"}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-xs text-status-clean">
                    {relativeTime(room.updated_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

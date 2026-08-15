import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLockup } from "@/components/brand-lockup";
import { useStaffRole } from "@/hooks/use-staff-role";

type RoomStatus = "occupied" | "vacant_clean" | "vacant_dirty" | "out_of_order";

type RoomRow = {
  id: string;
  number: string;
  floor: number;
  bed_type: string;
  status: RoomStatus;
  guest_name: string | null;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
};

type RequestRow = {
  id: string;
  room: string;
  type: string;
  status: string;
  created_at: string;
};

const STATUS_ORDER: RoomStatus[] = [
  "occupied",
  "vacant_clean",
  "vacant_dirty",
  "out_of_order",
];

const STATUS_LABEL: Record<RoomStatus, string> = {
  occupied: "Occupied",
  vacant_clean: "Ready",
  vacant_dirty: "Needs clean",
  out_of_order: "Out of order",
};

const STATUS_CLASS: Record<RoomStatus, string> = {
  occupied: "border-cream/25 bg-cream/10 text-cream",
  vacant_clean: "border-sage/50 bg-sage/20 text-sage",
  vacant_dirty: "border-amber/50 bg-amber/15 text-amber",
  out_of_order: "border-clay/50 bg-clay/20 text-clay",
};

export const Route = createFileRoute("/front-desk")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Front Desk — Rodeway Hub" },
      {
        name: "description",
        content:
          "Front desk operations board: room status, arrivals and departures today, and open guest requests at a glance.",
      },
      { property: "og:title", content: "Front Desk — Rodeway Hub" },
      {
        property: "og:description",
        content:
          "Room board, arrivals and departures, and open requests in one shift view.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FrontDeskPage,
});

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function FrontDeskPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
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
          <h1 className="mt-8 text-4xl">Front desk</h1>
          <p className="mt-2 text-sm text-cream/60">
            Sign in with your staff account to open the operations board.
          </p>
          <Button
            asChild
            className="mt-6 w-full bg-amber text-ink hover:bg-amber/90"
          >
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

  return <Board />;
}

function Board() {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [filter, setFilter] = useState<"all" | RoomStatus>("all");
  const [loading, setLoading] = useState(true);
  const { canTriage, loading: roleLoading } = useStaffRole();
  const day = today();

  useEffect(() => {
    let active = true;

    async function load() {
      const [roomRes, reqRes] = await Promise.all([
        supabase
          .from("rooms")
          .select(
            "id, number, floor, bed_type, status, guest_name, check_in, check_out, notes",
          )
          .order("number"),
        supabase
          .from("requests")
          .select("id, room, type, status, created_at")
          .neq("status", "done")
          .order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      if (roomRes.error) toast.error("Couldn't load the room board.");
      setRooms((roomRes.data ?? []) as RoomRow[]);
      setRequests((reqRes.data ?? []) as RequestRow[]);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("front-desk-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const counts = STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = rooms.filter((room) => room.status === status).length;
        return acc;
      },
      {} as Record<RoomStatus, number>,
    );
    const sellable = rooms.filter((r) => r.status !== "out_of_order").length;
    return {
      counts,
      occupancy: sellable
        ? Math.round((counts.occupied / sellable) * 100)
        : 0,
      arrivals: rooms.filter((r) => r.check_in === day),
      departures: rooms.filter((r) => r.check_out === day),
    };
  }, [rooms, day]);

  const visible =
    filter === "all" ? rooms : rooms.filter((room) => room.status === filter);

  const byFloor = useMemo(() => {
    const map = new Map<number, RoomRow[]>();
    for (const room of visible) {
      const list = map.get(room.floor) ?? [];
      list.push(room);
      map.set(room.floor, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [visible]);

  const openByRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const req of requests) {
      map.set(req.room, (map.get(req.room) ?? 0) + 1);
    }
    return map;
  }, [requests]);

  async function setStatus(room: RoomRow, status: RoomStatus) {
    if (!canTriage) {
      toast.error("You don't have permission to update rooms.");
      return;
    }
    const previous = rooms;
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, status } : r)),
    );
    const { error } = await supabase
      .from("rooms")
      .update({ status })
      .eq("id", room.id);
    if (error) {
      setRooms(previous);
      toast.error("Couldn't update that room.");
      return;
    }
    toast.success(`Room ${room.number} — ${STATUS_LABEL[status]}`);
  }

  return (
    <div className="min-h-screen bg-ink px-6 py-8 text-cream md:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/15 pb-6">
        <div>
          <BrandLockup tone="cream" />
          <p className="signage mt-6 flex items-center gap-2 text-cream/60">
            <span aria-hidden className="h-3 w-[3px] bg-amber" />
            Front desk · Shift board
          </p>
          <h1 className="mt-3 text-4xl">Operations</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/staff"
            className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
          >
            Request queue
          </Link>
          <Link
            to="/"
            className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
          >
            Guest view
          </Link>
        </div>
      </header>

      {!roleLoading && !canTriage ? (
        <div className="mt-8 border border-amber/50 bg-amber/10 p-5">
          <p className="signage text-amber">View-only access</p>
          <p className="mt-2 text-sm text-cream/70">
            You can watch the board, but a manager must grant you staff access
            before you can change room statuses.
          </p>
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Occupancy" value={`${stats.occupancy}%`} />
        <Stat label="Arrivals today" value={stats.arrivals.length} />
        <Stat label="Departures today" value={stats.departures.length} />
        <Stat label="Open requests" value={requests.length} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="border border-cream/15 bg-cream/[0.03] px-5 py-4"
          >
            <p className="signage flex items-center gap-2 text-cream/60">
              <span aria-hidden className="h-3 w-[3px] bg-amber" />
              {STATUS_LABEL[status]}
            </p>
            <p className="mt-2 text-3xl">{stats.counts[status] ?? 0}</p>
          </div>
        ))}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              className={
                filter === "all"
                  ? "bg-amber text-ink hover:bg-amber/90"
                  : "border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
              }
              onClick={() => setFilter("all")}
            >
              All rooms
            </Button>
            {STATUS_ORDER.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={filter === status ? "default" : "outline"}
                className={
                  filter === status
                    ? "bg-amber text-ink hover:bg-amber/90"
                    : "border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                }
                onClick={() => setFilter(status)}
              >
                {STATUS_LABEL[status]}
              </Button>
            ))}
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-cream/50">Loading the board…</p>
          ) : byFloor.length === 0 ? (
            <p className="mt-8 text-sm text-cream/50">No rooms match.</p>
          ) : (
            byFloor.map(([floor, list]) => (
              <div key={floor} className="mt-8">
                <p className="signage text-cream/50">Floor {floor}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((room) => (
                    <article
                      key={room.id}
                      className="border border-cream/15 bg-cream/[0.03] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-2xl leading-none">
                            {room.number}
                          </h2>
                          <p className="mt-1 text-xs text-cream/50">
                            {room.bed_type}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={STATUS_CLASS[room.status]}
                        >
                          {STATUS_LABEL[room.status]}
                        </Badge>
                      </div>

                      <p className="mt-3 text-sm text-cream/70">
                        {room.guest_name ?? "Vacant"}
                        {room.check_out ? (
                          <span className="text-cream/40">
                            {" "}
                            · out {room.check_out}
                          </span>
                        ) : null}
                      </p>
                      {room.notes ? (
                        <p className="mt-1 text-xs text-cream/45">
                          {room.notes}
                        </p>
                      ) : null}
                      {openByRoom.get(room.number) ? (
                        <p className="signage mt-2 text-amber">
                          {openByRoom.get(room.number)} open request
                          {openByRoom.get(room.number) === 1 ? "" : "s"}
                        </p>
                      ) : null}

                      {canTriage ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {STATUS_ORDER.filter((s) => s !== room.status).map(
                            (status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant="outline"
                                className="border-cream/25 bg-transparent text-xs text-cream hover:bg-cream/10 hover:text-cream"
                                onClick={() => setStatus(room, status)}
                              >
                                {STATUS_LABEL[status]}
                              </Button>
                            ),
                          )}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <aside className="space-y-8">
          <div>
            <p className="signage flex items-center gap-2 text-cream/60">
              <span aria-hidden className="h-3 w-[3px] bg-amber" />
              Departures today
            </p>
            <ul className="mt-3 space-y-2">
              {stats.departures.length === 0 ? (
                <li className="text-sm text-cream/45">Nothing scheduled.</li>
              ) : (
                stats.departures.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center justify-between border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm"
                  >
                    <span>Room {room.number}</span>
                    <span className="text-cream/55">
                      {room.guest_name ?? "—"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <p className="signage flex items-center gap-2 text-cream/60">
              <span aria-hidden className="h-3 w-[3px] bg-amber" />
              Arrivals today
            </p>
            <ul className="mt-3 space-y-2">
              {stats.arrivals.length === 0 ? (
                <li className="text-sm text-cream/45">Nothing scheduled.</li>
              ) : (
                stats.arrivals.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center justify-between border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm"
                  >
                    <span>Room {room.number}</span>
                    <span className="text-cream/55">
                      {room.guest_name ?? room.notes ?? "Expected"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <p className="signage flex items-center gap-2 text-cream/60">
              <span aria-hidden className="h-3 w-[3px] bg-amber" />
              Open requests
            </p>
            <ul className="mt-3 space-y-2">
              {requests.length === 0 ? (
                <li className="text-sm text-cream/45">Queue is clear.</li>
              ) : (
                requests.slice(0, 8).map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center justify-between border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm"
                  >
                    <span>
                      Room {req.room}
                      <span className="text-cream/45"> · {req.type}</span>
                    </span>
                    <span className="signage text-amber">
                      {req.status === "new" ? "New" : "Working"}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <Link
              to="/staff"
              className="signage mt-4 inline-block text-cream/60 transition-colors duration-200 hover:text-amber"
            >
              Open the full queue →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-cream/15 bg-cream/[0.03] px-5 py-4">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        {label}
      </p>
      <p className="mt-2 text-4xl">{value}</p>
    </div>
  );
}

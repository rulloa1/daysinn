import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrandLockup } from "@/components/brand-lockup";
import { useStaffRole } from "@/hooks/use-staff-role";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import {
  average,
  formatDuration,
  logRoomStatusChange,
  startOfToday,
  type RoomStatusEvent,
  type StaffIdentity,
} from "@/lib/ops";
import { QrCode } from "@/components/qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { revokeRoomQr, rotateRoomQr } from "@/lib/guest.functions";

type RoomStatus =
  | "vacant_clean"
  | "vacant_dirty"
  | "occupied"
  | "occupied_dnd"
  | "out_of_order"
  | "reserved";

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
  updated_at: string;
};

type RequestRow = {
  id: string;
  room: string;
  type: string;
  status: string;
  created_at: string;
};

type BookingRow = {
  id: string;
  guest_name: string;
  room: string;
  phone: string | null;
  check_in: string;
  check_out: string;
  notes: string | null;
};

const STATUS_ORDER: RoomStatus[] = [
  "vacant_clean",
  "vacant_dirty",
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

/** Card + dot colour per status. Status colour is the primary scan cue. */
const STATUS_CARD: Record<RoomStatus, string> = {
  vacant_clean: "border-status-clean/55 bg-status-clean/12 hover:bg-status-clean/20",
  vacant_dirty: "border-status-dirty/55 bg-status-dirty/12 hover:bg-status-dirty/20",
  occupied: "border-status-occupied/55 bg-status-occupied/14 hover:bg-status-occupied/22",
  occupied_dnd: "border-status-dnd/55 bg-status-dnd/14 hover:bg-status-dnd/22",
  reserved: "border-status-reserved/55 bg-status-reserved/12 hover:bg-status-reserved/20",
  out_of_order: "border-status-ooo/55 bg-status-ooo/12 hover:bg-status-ooo/20",
};

const STATUS_DOT: Record<RoomStatus, string> = {
  vacant_clean: "bg-status-clean",
  vacant_dirty: "bg-status-dirty",
  occupied: "bg-status-occupied",
  occupied_dnd: "bg-status-dnd",
  reserved: "bg-status-reserved",
  out_of_order: "bg-status-ooo",
};

const STATUS_TEXT: Record<RoomStatus, string> = {
  vacant_clean: "text-status-clean",
  vacant_dirty: "text-status-dirty",
  occupied: "text-status-occupied",
  occupied_dnd: "text-status-dnd",
  reserved: "text-status-reserved",
  out_of_order: "text-status-ooo",
};

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
        content:
          "Room status grid, bookings log, and open requests in one shift view.",
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

function stamp(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
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
            Sign in with your staff account to open the board.
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
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<"all" | RoomStatus>("all");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [qrRoom, setQrRoom] = useState<RoomRow | null>(null);
  const [events, setEvents] = useState<RoomStatusEvent[]>([]);
  const [resolvedToday, setResolvedToday] = useState<
    { id: string; response_seconds: number | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { canTriage, loading: roleLoading } = useStaffRole();
  const { members, staff, select, addMember } = useStaffIdentity();
  const day = today();

  useEffect(() => {
    let active = true;

    async function load() {
      const [roomRes, reqRes, bookRes, eventRes, resolvedRes] = await Promise.all([
        supabase
          .from("rooms")
          .select(
            "id, number, floor, bed_type, status, guest_name, check_in, check_out, notes, updated_at",
          )
          .order("number"),
        supabase
          .from("requests")
          .select("id, room, type, status, created_at")
          .neq("status", "done")
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("id, guest_name, room, phone, check_in, check_out, notes")
          .order("check_in"),
        supabase
          .from("room_status_events")
          .select(
            "id, room_number, old_status, new_status, staff_name, duration_seconds, is_turnover, changed_at",
          )
          .order("changed_at", { ascending: false })
          .limit(500),
        supabase
          .from("requests")
          .select("id, response_seconds")
          .gte("resolved_at", startOfToday()),
      ]);
      if (!active) return;
      if (roomRes.error) toast.error("Couldn't load the room board.");
      setRooms((roomRes.data ?? []) as RoomRow[]);
      setRequests((reqRes.data ?? []) as RequestRow[]);
      setBookings((bookRes.data ?? []) as BookingRow[]);
      setEvents((eventRes.data ?? []) as RoomStatusEvent[]);
      setResolvedToday(
        (resolvedRes.data ?? []) as { id: string; response_seconds: number | null }[],
      );
      setLoading(false);
    }

    void load();

    const channel = supabase
      .channel("front-desk-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_status_events" }, () => void load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => {
    return STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = rooms.filter((room) => room.status === status).length;
        return acc;
      },
      {} as Record<RoomStatus, number>,
    );
  }, [rooms]);

  const occupancy = useMemo(() => {
    const sellable = rooms.filter((r) => r.status !== "out_of_order").length;
    const taken = rooms.filter(
      (r) => r.status === "occupied" || r.status === "occupied_dnd",
    ).length;
    return sellable ? Math.round((taken / sellable) * 100) : 0;
  }, [rooms]);

  const arrivals = useMemo(
    () => bookings.filter((b) => b.check_in === day),
    [bookings, day],
  );
  const departures = useMemo(
    () => bookings.filter((b) => b.check_out === day),
    [bookings, day],
  );

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

  const requestsByRoom = useMemo(() => {
    const map = new Map<string, RequestRow[]>();
    for (const req of requests) {
      const list = map.get(req.room) ?? [];
      list.push(req);
      map.set(req.room, list);
    }
    return map;
  }, [requests]);

  const dayStart = startOfToday();

  const avgTurnover = useMemo(
    () =>
      average(
        events
          .filter(
            (e) =>
              e.is_turnover &&
              e.duration_seconds != null &&
              e.changed_at >= dayStart,
          )
          .map((e) => e.duration_seconds as number),
      ),
    [events, dayStart],
  );

  const avgResponse = useMemo(
    () =>
      average(
        resolvedToday
          .filter((r) => r.response_seconds != null)
          .map((r) => r.response_seconds as number),
      ),
    [resolvedToday],
  );

  const eventsByRoom = useMemo(() => {
    const map = new Map<string, RoomStatusEvent[]>();
    for (const event of events) {
      const list = map.get(event.room_number) ?? [];
      list.push(event);
      map.set(event.room_number, list);
    }
    return map;
  }, [events]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  async function saveRoom(
    room: RoomRow,
    patch: { status?: RoomStatus; guest_name?: string | null; notes?: string | null },
  ) {
    if (!canTriage) {
      toast.error("You don't have permission to update rooms.");
      return;
    }
    const previous = rooms;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? { ...r, ...patch, updated_at: new Date().toISOString() }
          : r,
      ),
    );
    const { error } = await supabase
      .from("rooms")
      .update(patch)
      .eq("id", room.id);
    if (error) {
      setRooms(previous);
      toast.error("Couldn't update that room.");
      return;
    }

    if (patch.status && patch.status !== room.status) {
      const logged = await logRoomStatusChange({
        roomId: room.id,
        roomNumber: room.number,
        oldStatus: room.status,
        newStatus: patch.status,
        previousChangedAt: room.updated_at,
        staff,
      });
      if (!logged.ok) toast.error("Room saved, but the change wasn't logged.");
    }

    toast.success(
      staff
        ? `Room ${room.number} updated by ${staff.name}`
        : `Room ${room.number} updated`,
    );
  }

  return (
    <div className="min-h-screen bg-ink px-4 py-8 text-cream md:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/15 pb-6">
        <div>
          <BrandLockup tone="cream" />
          <p className="signage mt-6 flex items-center gap-2 text-cream/60">
            <span aria-hidden className="h-3 w-[3px] bg-amber" />
            Front desk · Shift board
          </p>
          <h1 className="mt-3 text-4xl">Front desk board</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <StaffPicker members={members} staff={staff} onSelect={select} onAdd={addMember} />
          <Link to="/staff" className="signage text-cream/60 transition-colors duration-200 hover:text-amber">
            Request queue
          </Link>
          <Link to="/housekeeping" className="signage text-cream/60 transition-colors duration-200 hover:text-amber">
            Housekeeping
          </Link>
          <Link to="/checkin" search={{}} className="signage text-cream/60 transition-colors duration-200 hover:text-amber">
            Guest sign-in
          </Link>
          <Link to="/" className="signage text-cream/60 transition-colors duration-200 hover:text-amber">
            Guest view
          </Link>
        </div>
      </header>

      {!roleLoading && !canTriage ? (
        <div className="mt-8 border border-amber/50 bg-amber/10 p-5">
          <p className="signage text-amber">View-only access</p>
          <p className="mt-2 text-sm text-cream/70">
            You can watch the board, but a manager must grant you staff access
            before you can change rooms or bookings.
          </p>
        </div>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Occupancy" value={`${occupancy}%`} />
        <Stat label="Arrivals today" value={arrivals.length} />
        <Stat label="Departures today" value={departures.length} />
        <Stat label="Open requests" value={requests.length} />
        <Stat label="Avg turnover today" value={formatDuration(avgTurnover)} />
        <Stat label="Avg response today" value={formatDuration(avgResponse)} />
      </section>

      <section className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-6">
        {STATUS_ORDER.map((status) => {
          const on = filter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(on ? "all" : status)}
              aria-pressed={on}
              className={`border px-4 py-3 text-left transition-colors duration-200 ${STATUS_CARD[status]} ${on ? "ring-2 ring-amber" : ""}`}
            >
              <p className="signage flex items-center gap-2 text-cream/75">
                <span aria-hidden className={`h-3 w-[3px] ${STATUS_DOT[status]}`} />
                {STATUS_LABEL[status]}
              </p>
              <p className="mt-2 text-3xl">{counts[status] ?? 0}</p>
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
          Clear filter — showing {STATUS_LABEL[filter]} ({visible.length})
        </button>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <section>
          {loading ? (
            <p className="text-sm text-cream/50">Loading the board…</p>
          ) : byFloor.length === 0 ? (
            <p className="text-sm text-cream/50">No rooms match this filter.</p>
          ) : (
            byFloor.map(([floor, list]) => (
              <div key={floor} className="mb-8">
                <p className="signage text-cream/50">
                  Floor {floor} · {list.length} rooms
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                  {list.map((room) => {
                    const open = requestsByRoom.get(room.number)?.length ?? 0;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setActiveRoomId(room.id)}
                        className={`border p-3 text-left transition-colors duration-200 ${STATUS_CARD[room.status]}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-2xl leading-none">{room.number}</span>
                          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[room.status]}`} />
                        </div>
                        <p className={`signage mt-2 ${STATUS_TEXT[room.status]}`}>
                          {STATUS_LABEL[room.status]}
                        </p>
                        <p className="mt-1 truncate text-xs text-cream/70">
                          {room.guest_name ?? room.bed_type}
                        </p>
                        {open ? (
                          <p className="signage mt-1 text-amber">{open} request{open === 1 ? "" : "s"}</p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        <aside className="space-y-8">
          <Panel title="Arriving today">
            {arrivals.length === 0 ? (
              <li className="text-sm text-cream/45">Nothing scheduled.</li>
            ) : (
              arrivals.map((b) => (
                <li key={b.id} className="flex items-center justify-between border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm">
                  <span>Room {b.room}</span>
                  <span className="text-cream/55">{b.guest_name}</span>
                </li>
              ))
            )}
          </Panel>

          <Panel title="Departing today">
            {departures.length === 0 ? (
              <li className="text-sm text-cream/45">Nothing scheduled.</li>
            ) : (
              departures.map((b) => (
                <li key={b.id} className="flex items-center justify-between border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm">
                  <span>Room {b.room}</span>
                  <span className="text-cream/55">{b.guest_name}</span>
                </li>
              ))
            )}
          </Panel>

          <Panel title="Open requests">
            {requests.length === 0 ? (
              <li className="text-sm text-cream/45">Queue is clear.</li>
            ) : (
              requests.slice(0, 8).map((req) => (
                <li key={req.id} className="flex items-center justify-between border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm">
                  <button
                    type="button"
                    className="text-left underline-offset-4 hover:text-amber hover:underline"
                    onClick={() => {
                      const match = rooms.find((r) => r.number === req.room);
                      if (match) setActiveRoomId(match.id);
                    }}
                  >
                    Room {req.room} · {req.type}
                  </button>
                  <span className="text-cream/45">{stamp(req.created_at)}</span>
                </li>
              ))
            )}
          </Panel>
        </aside>
      </div>

      <BookingsLog
        bookings={bookings}
        canEdit={canTriage}
        arrivals={arrivals}
        departures={departures}
      />

      <RoomPanel
        room={activeRoom}
        canEdit={canTriage}
        requests={activeRoom ? (requestsByRoom.get(activeRoom.number) ?? []) : []}
        history={activeRoom ? (eventsByRoom.get(activeRoom.number) ?? []) : []}
        staff={staff}
        onClose={() => setActiveRoomId(null)}
        onSave={saveRoom}
        onQr={(room) => {
          setActiveRoomId(null);
          setQrRoom(room);
        }}
      />

      <RoomQrDialog room={qrRoom} onClose={() => setQrRoom(null)} />
    </div>
  );
}

function StaffPicker({
  members,
  staff,
  onSelect,
  onAdd,
}: {
  members: { id: string; name: string }[];
  staff: StaffIdentity;
  onSelect: (next: StaffIdentity) => void;
  onAdd: (name: string) => Promise<unknown>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-2">
      <span className="signage text-cream/45">On desk</span>
      <select
        aria-label="Staff member on desk"
        value={staff?.id ?? ""}
        onChange={(e) => {
          const match = members.find((m) => m.id === e.target.value);
          onSelect(match ? { id: match.id, name: match.name } : null);
        }}
        className="border border-cream/25 bg-cream/[0.04] px-2 py-1 text-sm text-cream"
      >
        <option value="">Not set</option>
        {members.map((m) => (
          <option key={m.id} value={m.id} className="text-ink">
            {m.name}
          </option>
        ))}
      </select>
      {adding ? (
        <span className="flex items-center gap-2">
          <Input
            value={name}
            autoFocus
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-32 border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
          />
          <Button
            size="sm"
            className="bg-amber text-ink hover:bg-amber/90"
            onClick={async () => {
              await onAdd(name);
              setName("");
              setAdding(false);
            }}
          >
            Save
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="signage text-cream/50 transition-colors duration-200 hover:text-amber"
        >
          + Add
        </button>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        {title}
      </p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function RoomPanel({
  room,
  canEdit,
  requests,
  history,
  staff,
  onClose,
  onSave,
  onQr,
}: {
  room: RoomRow | null;
  canEdit: boolean;
  requests: RequestRow[];
  history: RoomStatusEvent[];
  staff: StaffIdentity;
  onClose: () => void;
  onSave: (
    room: RoomRow,
    patch: { status?: RoomStatus; guest_name?: string | null; notes?: string | null },
  ) => Promise<void>;
  onQr: (room: RoomRow) => void;
}) {
  const [guest, setGuest] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setGuest(room?.guest_name ?? "");
    setNotes(room?.notes ?? "");
  }, [room?.id, room?.guest_name, room?.notes]);

  return (
    <Dialog open={!!room} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-cream/20 bg-ink text-cream sm:max-w-md">
        {room ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl">Room {room.number}</DialogTitle>
              <DialogDescription className="text-cream/60">
                {room.bed_type} · Floor {room.floor} · updated {stamp(room.updated_at)}
              </DialogDescription>
            </DialogHeader>

            {!staff ? (
              <p className="border border-amber/45 bg-amber/10 px-3 py-2 text-xs text-cream/75">
                Pick who is on the desk at the top of the board so changes are
                attributed to you.
              </p>
            ) : null}

            <div>
              <p className="signage text-cream/55">Status</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => void onSave(room, { status })}
                    className={`border px-3 py-2 text-left text-xs transition-colors duration-200 disabled:opacity-45 ${STATUS_CARD[status]} ${room.status === status ? "ring-2 ring-amber" : ""}`}
                  >
                    <span aria-hidden className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${STATUS_DOT[status]}`} />
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="signage text-cream/55">Guest name</p>
                <Input
                  value={guest}
                  disabled={!canEdit}
                  onChange={(e) => setGuest(e.target.value)}
                  placeholder="Unassigned"
                  className="mt-2 border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
                />
              </div>
              <div>
                <p className="signage text-cream/55">Notes</p>
                <Textarea
                  value={notes}
                  disabled={!canEdit}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="AC repaired, late checkout requested…"
                  className="mt-2 min-h-20 border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
                />
              </div>
            </div>

            {requests.length ? (
              <div>
                <p className="signage text-amber">Open guest requests</p>
                <ul className="mt-2 space-y-1 text-sm text-cream/75">
                  {requests.map((req) => (
                    <li key={req.id}>
                      {req.type} · {req.status} · {stamp(req.created_at)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="signage text-cream/60 underline-offset-4 transition-colors duration-200 hover:text-amber hover:underline"
              >
                {showHistory ? "Hide room history" : "Room history"} ({history.length})
              </button>
              {showHistory ? (
                <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1 text-xs">
                  {history.length === 0 ? (
                    <li className="text-cream/45">No status changes logged yet.</li>
                  ) : (
                    history.slice(0, 12).map((event) => (
                      <li
                        key={event.id}
                        className="border border-cream/15 bg-cream/[0.03] px-3 py-2"
                      >
                        <p className="text-cream/85">
                          {event.old_status
                            ? STATUS_LABEL[event.old_status as RoomStatus]
                            : "—"}{" "}
                          → {STATUS_LABEL[event.new_status as RoomStatus]}
                        </p>
                        <p className="mt-1 text-cream/50">
                          {event.staff_name ?? "Unattributed"} · {stamp(event.changed_at)}
                          {event.is_turnover && event.duration_seconds != null
                            ? ` · turnover ${formatDuration(event.duration_seconds)}`
                            : ""}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-amber text-ink hover:bg-amber/90"
                disabled={!canEdit || saving}
                onClick={async () => {
                  setSaving(true);
                  await onSave(room, {
                    guest_name: guest.trim() || null,
                    notes: notes.trim() || null,
                  });
                  setSaving(false);
                  onClose();
                }}
              >
                Save changes
              </Button>
              <Button
                variant="outline"
                className="border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                onClick={() => onQr(room)}
              >
                Guest QR
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BookingsLog({
  bookings,
  canEdit,
  arrivals,
  departures,
}: {
  bookings: BookingRow[];
  canEdit: boolean;
  arrivals: BookingRow[];
  departures: BookingRow[];
}) {
  const [form, setForm] = useState({
    guest_name: "",
    room: "",
    phone: "",
    check_in: today(),
    check_out: today(),
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!form.guest_name.trim() || !form.room.trim()) {
      toast.error("Guest name and room number are required.");
      return;
    }
    if (form.check_out < form.check_in) {
      toast.error("Check-out can't be before check-in.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      guest_name: form.guest_name.trim(),
      room: form.room.trim(),
      phone: form.phone.trim() || null,
      check_in: form.check_in,
      check_out: form.check_out,
      notes: form.notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't save that booking.");
      return;
    }
    toast.success("Booking added.");
    setForm({
      guest_name: "",
      room: "",
      phone: "",
      check_in: today(),
      check_out: today(),
      notes: "",
    });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't remove that booking.");
      return;
    }
    toast.success("Booking removed.");
  }

  const field = "border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35";

  return (
    <section className="mt-12 border-t border-cream/15 pt-8">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        Bookings log
      </p>
      <h2 className="mt-3 text-3xl">
        {bookings.length} booking{bookings.length === 1 ? "" : "s"} on file
      </h2>

      {canEdit ? (
        <div className="mt-6 grid gap-3 border border-cream/15 bg-cream/[0.03] p-4 md:grid-cols-3 xl:grid-cols-6">
          <Input
            value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            placeholder="Guest name"
            className={field}
          />
          <Input
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            placeholder="Room"
            className={field}
          />
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone (optional)"
            className={field}
          />
          <Input
            type="date"
            aria-label="Check-in date"
            value={form.check_in}
            onChange={(e) => setForm({ ...form, check_in: e.target.value })}
            className={field}
          />
          <Input
            type="date"
            aria-label="Check-out date"
            value={form.check_out}
            onChange={(e) => setForm({ ...form, check_out: e.target.value })}
            className={field}
          />
          <Input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes (optional)"
            className={field}
          />
          <Button
            className="bg-amber text-ink hover:bg-amber/90 md:col-span-3 xl:col-span-2"
            disabled={busy}
            onClick={() => void add()}
          >
            Add booking
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BookingList title="Arriving today" rows={arrivals} canEdit={false} onRemove={remove} />
        <BookingList title="Departing today" rows={departures} canEdit={false} onRemove={remove} />
      </div>

      <div className="mt-6">
        <BookingList
          title="All bookings"
          rows={[...bookings].sort((a, b) => a.check_in.localeCompare(b.check_in))}
          canEdit={canEdit}
          onRemove={remove}
        />
      </div>
    </section>
  );
}

function BookingList({
  title,
  rows,
  canEdit,
  onRemove,
}: {
  title: string;
  rows: BookingRow[];
  canEdit: boolean;
  onRemove: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <p className="signage text-cream/55">{title}</p>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-cream/45">Nothing here yet.</li>
        ) : (
          rows.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm"
            >
              <div>
                <p className="text-cream">
                  {b.guest_name} · Room {b.room}
                </p>
                <p className="text-xs text-cream/55">
                  {b.check_in} → {b.check_out}
                  {b.phone ? ` · ${b.phone}` : ""}
                  {b.notes ? ` · ${b.notes}` : ""}
                </p>
              </div>
              {canEdit ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cream/25 bg-transparent text-xs text-cream hover:bg-cream/10 hover:text-cream"
                  onClick={() => void onRemove(b.id)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function RoomQrDialog({
  room,
  onClose,
}: {
  room: RoomRow | null;
  onClose: () => void;
}) {
  const rotate = useServerFn(rotateRoomQr);
  const revoke = useServerFn(revokeRoomQr);
  const [state, setState] = useState<{ url: string; expiresAt: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const number = room?.number ?? null;

  const issue = useCallback(
    async (roomNumber: string) => {
      setBusy(true);
      try {
        const result = await rotate({ data: { room: roomNumber } });
        setState({
          url: `${window.location.origin}/checkin?room=${encodeURIComponent(
            roomNumber,
          )}&t=${result.token}`,
          expiresAt: result.expiresAt,
        });
      } catch {
        toast.error("Could not issue a sign-in code.");
        setState(null);
      } finally {
        setBusy(false);
      }
    },
    [rotate],
  );

  useEffect(() => {
    setState(null);
    if (number) void issue(number);
  }, [number, issue]);

  useEffect(() => {
    if (!state) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  const msLeft = state ? Date.parse(state.expiresAt) - now : 0;
  const expired = state !== null && msLeft <= 0;
  const countdown = (() => {
    const total = Math.max(0, Math.floor(msLeft / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  })();

  return (
    <Dialog open={room !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Room {room?.number} sign-in</DialogTitle>
          <DialogDescription>
            Single-use code. It expires on its own and is burned the moment the
            guest signs in, so an old scan or screenshot won't work later.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {state && !expired ? (
            <>
              <QrCode
                value={state.url}
                size={220}
                alt={`Sign-in QR for room ${room?.number}`}
              />
              <p className="signage text-amber">Expires in {countdown}</p>
              <p className="break-all text-center text-xs text-muted-foreground">
                {state.url}
              </p>
            </>
          ) : (
            <p className="py-10 text-sm text-muted-foreground">
              {busy
                ? "Issuing a fresh code…"
                : expired
                  ? "This code expired. Generate a new one."
                  : "No active code."}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !room}
              onClick={() => room && void issue(room.number)}
            >
              {state ? "New code" : "Generate code"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !room || !state}
              onClick={async () => {
                if (!room) return;
                setBusy(true);
                try {
                  await revoke({ data: { room: room.number } });
                  setState(null);
                  toast.success("Codes for this room are revoked.");
                } catch {
                  toast.error("Could not revoke codes.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Revoke
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!state || expired}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrandLockup } from "@/components/brand-lockup";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { useStaffRole } from "@/hooks/use-staff-role";
import { logRoomStatusChange, type StaffIdentity } from "@/lib/ops";
import { verifyStaffPin } from "@/lib/housekeeping.functions";
import {
  enableDevicePush,
  pushPermission,
  pushSupported,
  sendDevicePush,
} from "@/lib/device-alerts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  status: RoomStatus;
  guest_name: string | null;
  check_out: string | null;
  notes: string | null;
  dnd: boolean;
  extended_stay: boolean;
  updated_at: string;
  assigned_staff_id: string | null;
  assigned_name: string | null;
};

const STATUS_LABEL: Record<RoomStatus, string> = {
  vacant_dirty: "Vacant dirty",
  occupied: "Occupied",
  occupied_dnd: "Occupied / DND",
  vacant_clean: "Vacant clean",
  reserved: "Reserved",
  out_of_order: "Out of order",
};

const STATUS_CARD: Record<RoomStatus, string> = {
  vacant_clean: "border-status-clean/55 bg-status-clean/12",
  vacant_dirty: "border-status-dirty/70 bg-status-dirty/20",
  occupied: "border-status-occupied/55 bg-status-occupied/14",
  occupied_dnd: "border-status-dnd/70 bg-status-dnd/20",
  reserved: "border-status-reserved/55 bg-status-reserved/12",
  out_of_order: "border-status-ooo/55 bg-status-ooo/12",
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

/** Housekeeping priority: what needs a cart first. */
const PRIORITY: RoomStatus[] = [
  "vacant_dirty",
  "occupied",
  "occupied_dnd",
  "reserved",
  "vacant_clean",
  "out_of_order",
];

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
        content:
          "Live room status for housekeeping, sorted by what needs cleaning first.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HousekeepingPage,
});

function stamp(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function HousekeepingPage() {
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

function HousekeeperLogin({
  members,
  onSelect,
  onAdd,
}: {
  members: { id: string; name: string }[];
  onSelect: (next: StaffIdentity) => void;
  onAdd: (name: string) => Promise<unknown>;
}) {
  const verify = useServerFn(verifyStaffPin);
  const [memberId, setMemberId] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function signIn() {
    if (!memberId) return;
    setBusy(true);
    const res = await verify({ data: { memberId, pin } });
    setBusy(false);
    if (!res.ok) {
      toast.error(
        res.reason === "bad_pin" ? "That PIN doesn't match." : "Housekeeper not found.",
      );
      return;
    }
    onSelect({ id: res.id, name: res.name });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-10 text-cream">
      <div className="w-full max-w-sm">
        <BrandLockup tone="cream" />
        <p className="signage mt-6 flex items-center gap-2 text-cream/60">
          <span aria-hidden className="h-3 w-[3px] bg-amber" />
          Housekeeping
        </p>
        <h1 className="mt-3 text-4xl">Who's cleaning?</h1>
        <p className="mt-2 text-sm text-cream/60">
          Pick your name so every room you turn is logged to you.
        </p>

        <label className="signage mt-8 block text-cream/50" htmlFor="hk-name">
          Housekeeper
        </label>
        <select
          id="hk-name"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="mt-2 h-12 w-full border border-cream/25 bg-cream/[0.04] px-3 text-base text-cream"
        >
          <option value="">Select your name</option>
          {members.map((m) => (
            <option key={m.id} value={m.id} className="text-ink">
              {m.name}
            </option>
          ))}
        </select>

        <label className="signage mt-5 block text-cream/50" htmlFor="hk-pin">
          PIN (if you have one)
        </label>
        <Input
          id="hk-pin"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="mt-2 h-12 border-cream/20 bg-cream/[0.04] text-base text-cream placeholder:text-cream/35"
        />

        <Button
          onClick={signIn}
          disabled={!memberId || busy}
          className="mt-6 h-12 w-full bg-amber text-base text-ink hover:bg-amber/90"
        >
          {busy ? "Checking…" : "Start shift"}
        </Button>

        {adding ? (
          <div className="mt-6 flex gap-2">
            <Input
              autoFocus
              value={newName}
              placeholder="Your name"
              onChange={(e) => setNewName(e.target.value)}
              className="h-11 border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
            />
            <Button
              className="h-11 bg-cream/10 text-cream hover:bg-cream/20"
              onClick={async () => {
                await onAdd(newName);
                setNewName("");
                setAdding(false);
              }}
            >
              Add
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="signage mt-6 text-cream/50 transition-colors duration-200 hover:text-amber"
          >
            + Add me to the roster
          </button>
        )}

        <Link
          to="/staff"
          className="signage mt-8 inline-block text-cream/45 transition-colors duration-200 hover:text-amber"
        >
          ← Staff portal
        </Link>
      </div>
    </div>
  );
}

const ALERTS_KEY = "daysinn.housekeeping.alerts";
const PUSH_KEY = "daysinn.housekeeping.push";

function HousekeepingBoard({
  staff,
  onSignOut,
}: {
  staff: NonNullable<StaffIdentity>;
  onSignOut: () => void;
}) {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "dirty" | "mine">("all");
  const [query, setQuery] = useState("");
  const [alertsOn, setAlertsOn] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [issueRoom, setIssueRoom] = useState<RoomRow | null>(null);
  const alertsRef = useRef(false);
  const pushRef = useRef(false);
  const { canTriage, loading: roleLoading } = useStaffRole();

  useEffect(() => {
    setAlertsOn(localStorage.getItem(ALERTS_KEY) === "on");
    setPushOn(
      localStorage.getItem(PUSH_KEY) === "on" && pushPermission() === "granted",
    );
  }, []);

  useEffect(() => {
    alertsRef.current = alertsOn;
  }, [alertsOn]);

  useEffect(() => {
    pushRef.current = pushOn;
  }, [pushOn]);


  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("rooms")
        .select(
          "id, number, floor, status, guest_name, check_out, notes, dnd, extended_stay, updated_at, assigned_staff_id, assigned_name",
        )
        .order("number");
      if (!active) return;
      if (error) toast.error("Couldn't load rooms.");
      setRooms((data ?? []) as RoomRow[]);
      setLoading(false);
    }

    void load();
    const channel = supabase
      .channel("housekeeping-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        (payload) => {
          if (alertsRef.current && payload.eventType === "UPDATE") {
            const next = payload.new as Partial<RoomRow>;
            const prev = (payload.old ?? {}) as Partial<RoomRow>;
            const emit = (
              level: "warning" | "info",
              title: string,
              description?: string,
            ) => {
              toast[level](title, description ? { description } : undefined);
              if (pushRef.current) {
                sendDevicePush(title, description ?? "", `room-${next.number}`);
              }
            };
            if (next.dnd && !prev.dnd) {
              emit(
                "warning",
                `Room ${next.number} is now Do Not Disturb`,
                "Skip this room until the flag clears.",
              );
            }
            if (next.extended_stay && !prev.extended_stay) {
              emit(
                "info",
                `Room ${next.number} is staying over`,
                next.check_out
                  ? `New checkout ${next.check_out}`
                  : "Service as a stayover, not a checkout.",
              );
            } else if (
              next.extended_stay &&
              prev.extended_stay &&
              next.check_out !== prev.check_out
            ) {
              emit(
                "info",
                `Room ${next.number} stayover updated`,
                next.check_out ? `New checkout ${next.check_out}` : undefined,
              );
            }
          }
          void load();
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  function toggleAlerts() {
    setAlertsOn((v) => {
      const next = !v;
      localStorage.setItem(ALERTS_KEY, next ? "on" : "off");
      toast[next ? "success" : "message"](
        next ? "Live alerts on" : "Live alerts off",
      );
      return next;
    });
  }

  async function togglePush() {
    if (pushOn) {
      setPushOn(false);
      localStorage.setItem(PUSH_KEY, "off");
      toast.message("Device notifications off");
      return;
    }
    const result = await enableDevicePush();
    if (!result.ok) {
      toast.error("Can't turn on device notifications", {
        description: result.reason,
      });
      return;
    }
    setPushOn(true);
    localStorage.setItem(PUSH_KEY, "on");
    if (!alertsRef.current) {
      setAlertsOn(true);
      localStorage.setItem(ALERTS_KEY, "on");
    }
    toast.success("Device notifications on", {
      description: "You'll get a phone alert even when this tab is in the background.",
    });
    sendDevicePush(
      "Days Inn housekeeping alerts on",
      "You'll be notified about DND flags and stayovers.",
      "hk-test",
    );
  }


  const floors = useMemo(() => {
    const base =
      filter === "dirty"
        ? rooms.filter((r) => r.status === "vacant_dirty")
        : filter === "mine"
          ? rooms.filter((r) => r.assigned_staff_id === staff.id)
          : rooms;
    const q = query.trim().toLowerCase();
    const pool = q ? base.filter((r) => String(r.number).toLowerCase().includes(q)) : base;

    const byFloor = new Map<number, RoomRow[]>();
    for (const room of pool) {
      const list = byFloor.get(room.floor) ?? [];
      list.push(room);
      byFloor.set(room.floor, list);
    }
    return [...byFloor.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([floor, list]) => ({
        floor,
        rooms: list.sort(
          (a, b) =>
            PRIORITY.indexOf(a.status) - PRIORITY.indexOf(b.status) ||
            a.number.localeCompare(b.number),
        ),
      }));
  }, [rooms, filter, staff.id, query]);

  const toClean = rooms.filter((r) => r.status === "vacant_dirty").length;
  const dnd = rooms.filter((r) => r.dnd).length;
  const stayovers = rooms.filter((r) => r.extended_stay).length;
  const mine = rooms.filter((r) => r.assigned_staff_id === staff.id);
  const mineLeft = mine.filter((r) => r.status === "vacant_dirty").length;
  const mineDone = mine.length - mineLeft;
  const active = rooms.find((r) => r.id === activeId) ?? null;

  async function setAssignment(room: RoomRow, toMe: boolean) {
    if (!canTriage) {
      toast.error("A manager needs to grant you staff access first.");
      return;
    }
    const patch = toMe
      ? {
          assigned_staff_id: staff.id,
          assigned_name: staff.name,
          assigned_at: new Date().toISOString(),
        }
      : { assigned_staff_id: null, assigned_name: null, assigned_at: null };
    const previous = rooms;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? {
              ...r,
              assigned_staff_id: patch.assigned_staff_id,
              assigned_name: patch.assigned_name,
            }
          : r,
      ),
    );
    const { error } = await supabase.from("rooms").update(patch).eq("id", room.id);
    if (error) {
      setRooms(previous);
      toast.error("Couldn't update the assignment.");
      return;
    }
    toast.success(
      toMe ? `Room ${room.number} assigned to you` : `Room ${room.number} unassigned`,
    );
  }


  async function markClean(room: RoomRow) {
    if (!canTriage) {
      toast.error("A manager needs to grant you staff access first.");
      return;
    }
    const previous = rooms;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? { ...r, status: "vacant_clean", updated_at: new Date().toISOString() }
          : r,
      ),
    );
    const { error } = await supabase
      .from("rooms")
      .update({ status: "vacant_clean" })
      .eq("id", room.id);
    if (error) {
      setRooms(previous);
      toast.error("Couldn't update that room.");
      return;
    }
    const logged = await logRoomStatusChange({
      roomId: room.id,
      roomNumber: room.number,
      oldStatus: room.status,
      newStatus: "vacant_clean",
      previousChangedAt: room.updated_at,
      staff,
    });
    if (!logged.ok) toast.error("Room saved, but the change wasn't logged.");
    else toast.success(`Room ${room.number} clean · ${staff.name}`);
  }

  return (
    <div className="min-h-screen bg-ink px-3 pb-24 pt-4 text-cream sm:px-6 sm:pb-16 sm:pt-6">
      <header className="border-b border-cream/15 pb-4 sm:pb-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <BrandLockup tone="cream" />
            <p className="signage mt-4 flex items-center gap-2 text-cream/60 sm:mt-5">
              <span aria-hidden className="h-3 w-[3px] shrink-0 bg-amber" />
              <span className="truncate">Housekeeping · {staff.name}</span>
            </p>
            <h1 className="mt-2 truncate text-2xl sm:text-4xl">Rooms to turn</h1>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="signage shrink-0 border border-cream/20 px-3 py-2 text-cream/60 transition-colors duration-200 hover:text-amber"
          >
            End shift
          </button>
        </div>
      </header>

      {!roleLoading && !canTriage ? (
        <div className="mt-4 border border-amber/50 bg-amber/10 p-4">
          <p className="signage text-amber">View-only access</p>
          <p className="mt-2 text-sm text-cream/70">
            A manager must grant staff access before you can mark rooms clean.
          </p>
        </div>
      ) : null}

      <section className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Stat label="To clean" value={toClean} />
        <Stat label="My rooms left" value={mineLeft} />
        <Stat label="Do not disturb" value={dnd} />
        <Stat label="Staying over" value={stayovers} />
      </section>

      {mine.length ? (
        <div className="mt-3 border border-cream/15 bg-cream/[0.03] px-4 py-3">
          <p className="signage text-cream/50">
            My shift · {mineDone}/{mine.length} done
          </p>
          <div className="mt-2 h-1.5 w-full bg-cream/10">
            <div
              className="h-full bg-amber transition-all duration-300"
              style={{ width: `${Math.round((mineDone / mine.length) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="sticky top-0 z-20 -mx-3 mt-4 bg-ink/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Input
          value={query}
          inputMode="numeric"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a room number…"
          className="h-12 border-cream/20 bg-cream/[0.04] text-base text-cream placeholder:text-cream/35"
        />
        <div className="-mx-3 mt-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {(
            [
              ["all", "All rooms"],
              ["dirty", "Dirty only"],
              ["mine", `My rooms (${mine.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`signage shrink-0 snap-start border px-4 py-3 transition-colors duration-200 ${
                filter === key
                  ? "border-amber bg-amber/15 text-amber"
                  : "border-cream/20 text-cream/60"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={toggleAlerts}
            aria-pressed={alertsOn}
            className={`signage shrink-0 snap-start border px-4 py-3 transition-colors duration-200 ${
              alertsOn ? "border-amber bg-amber/15 text-amber" : "border-cream/20 text-cream/60"
            }`}
          >
            {alertsOn ? "Alerts on" : "Alerts off"}
          </button>
          {pushSupported() ? (
            <button
              type="button"
              onClick={() => void togglePush()}
              aria-pressed={pushOn}
              className={`signage shrink-0 snap-start border px-4 py-3 transition-colors duration-200 ${
                pushOn ? "border-amber bg-amber/15 text-amber" : "border-cream/20 text-cream/60"
              }`}
            >
              {pushOn ? "Phone alerts on" : "Phone alerts off"}
            </button>
          ) : null}
        </div>
      </div>


      {loading ? (
        <p className="mt-8 text-sm text-cream/50">Loading rooms…</p>
      ) : (
        floors.map(({ floor, rooms: list }) => (
          <section key={floor} className="mt-8">
            <p className="signage flex items-center gap-2 text-cream/50">
              <span aria-hidden className="h-3 w-[3px] bg-cream/30" />
              Floor {floor} · {list.length} rooms
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {list.map((room) => (
                <div
                  key={room.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveId(room.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveId(room.id);
                    }
                  }}
                  className={`cursor-pointer border p-3 text-left transition-colors duration-200 ${STATUS_CARD[room.status]}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-xl">{room.number}</span>
                    <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[room.status]}`} />
                  </span>
                  <span className={`signage mt-2 block ${STATUS_TEXT[room.status]}`}>
                    {STATUS_LABEL[room.status]}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    {room.dnd ? (
                      <span className="signage flex items-center gap-1 bg-status-dnd px-1.5 py-0.5 text-[0.6rem] text-ink">
                        <span aria-hidden>⛔</span> DND
                      </span>
                    ) : null}
                    {room.extended_stay ? (
                      <span className="signage flex items-center gap-1 bg-amber px-1.5 py-0.5 text-[0.6rem] text-ink">
                        <span aria-hidden>↻</span> Stayover
                      </span>
                    ) : null}
                    {room.assigned_name ? (
                      <span
                        className={`signage px-1.5 py-0.5 text-[0.6rem] ${
                          room.assigned_staff_id === staff.id
                            ? "bg-cream text-ink"
                            : "border border-cream/30 text-cream/60"
                        }`}
                      >
                        {room.assigned_staff_id === staff.id ? "Mine" : room.assigned_name}
                      </span>
                    ) : null}
                  </span>
                  {room.status === "vacant_dirty" ? (
                    <span className="mt-3 block space-y-1.5">
                      {!room.assigned_staff_id || room.assigned_staff_id === staff.id ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void setAssignment(room, room.assigned_staff_id !== staff.id);
                          }}
                          className="signage block w-full border border-cream/25 px-2 py-1.5 text-center text-[0.6rem] text-cream/70"
                        >
                          {room.assigned_staff_id === staff.id ? "Release" : "Claim"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void markClean(room);
                        }}
                        className="signage block w-full bg-status-clean px-2 py-2 text-center text-[0.65rem] text-ink"
                      >
                        Mark clean
                      </button>
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <Dialog open={!!active} onOpenChange={(open) => !open && setActiveId(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto border-cream/20 bg-ink text-cream">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl">Room {active.number}</DialogTitle>
                <DialogDescription className="text-cream/60">
                  Floor {active.floor} · updated {stamp(active.updated_at)}
                </DialogDescription>
              </DialogHeader>

              <p className={`signage ${STATUS_TEXT[active.status]}`}>
                <span aria-hidden className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${STATUS_DOT[active.status]}`} />
                {STATUS_LABEL[active.status]}
              </p>

              <div className="flex flex-wrap gap-2">
                {active.dnd ? (
                  <span className="signage bg-status-dnd px-2 py-1 text-xs text-ink">
                    ⛔ Do not disturb
                  </span>
                ) : null}
                {active.extended_stay ? (
                  <span className="signage bg-amber px-2 py-1 text-xs text-ink">
                    ↻ Staying over — not a turn today
                  </span>
                ) : null}
              </div>

              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="signage text-cream/45">Guest</dt>
                  <dd className="mt-1 text-cream/85">{active.guest_name || "—"}</dd>
                </div>
                <div>
                  <dt className="signage text-cream/45">Checkout</dt>
                  <dd className="mt-1 text-cream/85">{active.check_out || "—"}</dd>
                </div>
                <div>
                  <dt className="signage text-cream/45">Front desk notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-cream/85">
                    {active.notes || "No notes."}
                  </dd>
                </div>
              </dl>

              <div className="border border-cream/15 bg-cream/[0.03] px-3 py-3">
                <p className="signage text-cream/45">Assigned to</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm text-cream/85">
                    {active.assigned_name ?? "Unassigned"}
                  </p>
                  {!active.assigned_staff_id || active.assigned_staff_id === staff.id ? (
                    <button
                      type="button"
                      disabled={!canTriage}
                      onClick={() =>
                        void setAssignment(active, active.assigned_staff_id !== staff.id)
                      }
                      className="signage border border-cream/25 px-3 py-2 text-cream/70 transition-colors duration-200 hover:text-amber disabled:opacity-40"
                    >
                      {active.assigned_staff_id === staff.id ? "Release" : "Assign to me"}
                    </button>
                  ) : null}
                </div>
              </div>

              {active.status === "vacant_dirty" ? (
                <Button
                  disabled={!canTriage}
                  onClick={() => {
                    void markClean(active);
                    setActiveId(null);
                  }}
                  className="h-12 w-full bg-status-clean text-base text-ink hover:bg-status-clean/90"
                >
                  Mark clean
                </Button>
              ) : (
                <p className="text-xs text-cream/45">
                  Read-only — front desk owns status changes for this room.
                </p>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setIssueRoom(active);
                  setActiveId(null);
                }}
                className="h-12 w-full border-amber/60 bg-transparent text-base text-amber hover:bg-amber/10 hover:text-amber"
              >
                Report an issue
              </Button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <IssueDialog
        room={issueRoom}
        staff={staff}
        onClose={() => setIssueRoom(null)}
      />

    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-cream/15 bg-cream/[0.03] px-3 py-3">
      <p className="signage text-cream/45">{label}</p>
      <p className="mt-1 text-2xl">{value}</p>
    </div>
  );
}

const ISSUE_TYPES = [
  { value: "maintenance", label: "Maintenance / repair" },
  { value: "supplies", label: "Supplies needed" },
  { value: "damage", label: "Damage or missing item" },
  { value: "front_desk", label: "Front desk follow-up" },
] as const;

function IssueDialog({
  room,
  staff,
  onClose,
}: {
  room: RoomRow | null;
  staff: NonNullable<StaffIdentity>;
  onClose: () => void;
}) {
  const [type, setType] = useState<string>("maintenance");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (room) {
      setType("maintenance");
      setDetails("");
    }
  }, [room]);

  async function submit() {
    if (!room) return;
    if (details.trim().length < 3) {
      toast.error("Add a short description of the issue.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("requests").insert({
      room: room.number,
      guest_name: `Housekeeping · ${staff.name}`,
      type,
      details: details.trim(),
      status: "new",
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't send that to the front desk.");
      return;
    }
    toast.success(`Issue sent for room ${room.number}`);
    onClose();
  }

  return (
    <Dialog open={!!room} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-cream/20 bg-ink text-cream">
        {room ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl">Report an issue</DialogTitle>
              <DialogDescription className="text-cream/60">
                Room {room.number} · goes straight to the staff request queue.
              </DialogDescription>
            </DialogHeader>

            <label className="signage block text-cream/50" htmlFor="issue-type">
              Type
            </label>
            <select
              id="issue-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-12 w-full border border-cream/25 bg-cream/[0.04] px-3 text-base text-cream"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="text-ink">
                  {t.label}
                </option>
              ))}
            </select>

            <label className="signage block text-cream/50" htmlFor="issue-details">
              What's wrong?
            </label>
            <Textarea
              id="issue-details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Shower drain is backing up; need two extra bath towels."
              className="border-cream/20 bg-cream/[0.04] text-base text-cream placeholder:text-cream/35"
            />

            <Button
              onClick={() => void submit()}
              disabled={busy}
              className="h-12 w-full bg-amber text-base text-ink hover:bg-amber/90"
            >
              {busy ? "Sending…" : "Send to front desk"}
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { RequestWorkflowPanel } from "@/components/request-workflow-panel";
import { REQUEST_STATUS_LABEL } from "@/lib/request-workflow";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrandLockup } from "@/components/brand-lockup";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { useStaffRole } from "@/hooks/use-staff-role";
import { type StaffIdentity } from "@/lib/ops";
import {
  createQueuedRoomStatusChange,
  enqueueRoomStatusChange,
  readQueuedRoomStatusChanges,
  roomStatusQueueSummary,
} from "@/lib/room-status-sync";
import { syncQueuedRoomStatusChange } from "@/lib/room-status-sync-executor";
import { verifyStaffPin } from "@/lib/housekeeping.functions";

import {
  enableDevicePush,
  pushPermission,
  pushSupported,
  sendDevicePush,
} from "@/lib/device-alerts";
import { subscribeWebPush, unsubscribeWebPush } from "@/lib/web-push-browser";
import { FloorPlan } from "@/components/floor-plan";
import { HousekeepingRunner } from "@/components/housekeeping-runner";
import { ShiftClock } from "@/components/shift-clock";
import { MySchedule } from "@/components/my-schedule";
import { MaintenanceTicketsPanel } from "@/components/maintenance-tickets-panel";
import { Footprints, Ban, RefreshCw, Sparkles, Building2, Calendar } from "lucide-react";
import { buildingForRoom, isDndActive, isExtendedStay, type BuildingName } from "@/lib/room-model";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RoomStatus =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "out_of_order" | "reserved";

type IssueRow = {
  id: string;
  room: string;
  type: string;
  details: string | null;
  status: string;
  created_at: string;
  started_at: string | null;
  started_by_name: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
};

type RoomRow = {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  guest_name: string | null;
  check_out: string | null;
  original_check_out?: string | null;
  notes: string | null;
  dnd: boolean;
  extended_stay: boolean;
  updated_at: string;
  assigned_staff_id: string | null;
  assigned_name: string | null;
  hk_stage: string | null;
  priority: string | null;
  linen_change: boolean | null;
};

const BUILDING_META: Record<BuildingName, { label: string; description: string }> = {
  "Main Building": {
    label: "Main Building",
    description: "Rooms 108–117 & 200–217 · Lobby, Pool & Front Wing",
  },
  "Building 2": {
    label: "Building 2",
    description: "Rooms 118–135 & 218–235 · Laundry & Facilities",
  },
  "Building 3": {
    label: "Building 3",
    description: "Rooms 136–163 & 236–265 · Courtyard & Rear Wing",
  },
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

const STATUS_PILL: Record<RoomStatus, string> = {
  vacant_clean: "border-status-clean/40 bg-status-clean/15 text-status-clean",
  vacant_dirty: "border-status-dirty/45 bg-status-dirty/15 text-status-dirty",
  occupied: "border-status-occupied/40 bg-status-occupied/15 text-status-occupied",
  occupied_dnd: "border-status-dnd/45 bg-status-dnd/15 text-status-dnd",
  reserved: "border-status-reserved/40 bg-status-reserved/15 text-status-reserved",
  out_of_order: "border-status-ooo/45 bg-status-ooo/15 text-status-ooo",
};

const STAGE_LABEL: Record<string, string> = {
  in_progress: "In progress",
  inspected: "Inspected",
};

/** One-tap cleaning states a housekeeper can set on their own rooms. */
const QUICK_STATUS: { status: RoomStatus; label: string; className: string }[] = [
  { status: "vacant_clean", label: "Clean", className: "bg-status-clean text-ink" },
  { status: "vacant_dirty", label: "Dirty", className: "bg-status-dirty text-ink" },
  { status: "occupied_dnd", label: "DND", className: "bg-status-dnd text-ink" },
  {
    status: "out_of_order",
    label: "Out of order",
    className: "border border-status-ooo/70 text-status-ooo",
  },
];

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
        content: "Live room status for housekeeping, sorted by what needs cleaning first.",
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
      toast.error(res.reason === "bad_pin" ? "That PIN doesn't match." : "Housekeeper not found.");
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
  const [allRooms, setAllRooms] = useState<RoomRow[]>([]);
  const [supervisor, setSupervisor] = useState(false);
  const [openIssues, setOpenIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "dirty" | "mine">("all");
  const [query, setQuery] = useState("");
  const [alertsOn, setAlertsOn] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map" | "runner">("grid");
  const [mapFloor, setMapFloor] = useState<1 | 2 | "both">(1);
  const [syncSummary, setSyncSummary] = useState({ pending: 0, conflicts: 0 });
  const [issueRoom, setIssueRoom] = useState<RoomRow | null>(null);
  const alertsRef = useRef(false);
  const pushRef = useRef(false);
  const { canTriage, loading: roleLoading } = useStaffRole();

  useEffect(() => {
    let active = true;
    async function loadSupervisor() {
      if (!staff.id) return;
      const { data } = await supabase
        .from("staff_members")
        .select("is_supervisor")
        .eq("id", staff.id)
        .maybeSingle();
      if (active) setSupervisor(Boolean(data?.is_supervisor));
    }
    void loadSupervisor();
    return () => {
      active = false;
    };
  }, [staff.id]);

  // Regular housekeepers only see their own rooms plus anything unassigned.
  // Supervisors see the full board and who is cleaning what.
  const rooms = useMemo(
    () =>
      supervisor
        ? allRooms
        : allRooms.filter((r) => !r.assigned_staff_id || r.assigned_staff_id === staff.id),
    [allRooms, supervisor, staff.id],
  );

  useEffect(() => {
    setAlertsOn(localStorage.getItem(ALERTS_KEY) === "on");
    setPushOn(localStorage.getItem(PUSH_KEY) === "on" && pushPermission() === "granted");
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
          "id, number, floor, status, guest_name, check_out, original_check_out, notes, dnd, extended_stay, updated_at, assigned_staff_id, assigned_name, hk_stage, priority, linen_change",
        )
        .order("number");
      if (!active) return;
      if (error) toast.error("Couldn't load rooms.");
      setAllRooms((data ?? []) as RoomRow[]);
      setLoading(false);

      const { data: issues } = await supabase
        .from("requests")
        .select(
          "id, room, type, details, status, created_at, started_at, started_by_name, resolved_at, resolved_by_name",
        )
        .neq("status", "done")
        .order("created_at", { ascending: false });
      if (active) setOpenIssues((issues ?? []) as IssueRow[]);
    }

    void load();
    const channel = supabase
      .channel("housekeeping-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => void load(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, (payload) => {
        if (alertsRef.current && payload.eventType === "UPDATE") {
          const next = payload.new as Partial<RoomRow>;
          const prev = (payload.old ?? {}) as Partial<RoomRow>;
          const emit = (level: "warning" | "info", title: string, description?: string) => {
            toast[level](title, description ? { description } : undefined);
            if (pushRef.current) {
              sendDevicePush(title, description ?? "", `room-${next.number}`);
            }
          };
          if (isDndActive(next) && !isDndActive(prev)) {
            emit(
              "warning",
              `Room ${next.number} is now Do Not Disturb`,
              "Skip this room until the flag clears.",
            );
          }
          if (isExtendedStay(next) && !isExtendedStay(prev)) {
            emit(
              "info",
              `Room ${next.number} is an extended stay`,
              next.check_out
                ? `New checkout ${next.check_out}`
                : "Service as a stayover, not a checkout.",
            );
          } else if (
            isExtendedStay(next) &&
            isExtendedStay(prev) &&
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
      })
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
      toast[next ? "success" : "message"](next ? "Live alerts on" : "Live alerts off");
      return next;
    });
  }

  async function togglePush() {
    if (pushOn) {
      setPushOn(false);
      localStorage.setItem(PUSH_KEY, "off");
      void unsubscribeWebPush();
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

    const background = await subscribeWebPush({
      ...(staff.id ? { id: staff.id } : {}),
      ...(staff.name ? { name: staff.name } : {}),
    });
    if (background.ok) {
      toast.success("Device notifications on", {
        description: "Alerts arrive even when this tab is closed.",
      });
    } else {
      toast.success("Device notifications on", {
        description: `Background alerts unavailable: ${background.reason}`,
      });
    }
    sendDevicePush(
      "Days Inn housekeeping alerts on",
      "You'll be notified about DND flags and stayovers.",
      "hk-test",
    );
  }

  const buildings = useMemo(() => {
    const base =
      filter === "dirty"
        ? rooms.filter((r) => r.status === "vacant_dirty")
        : filter === "mine"
          ? rooms.filter((r) => r.assigned_staff_id === staff.id)
          : rooms;
    const q = query.trim().toLowerCase();
    const pool = q ? base.filter((r) => String(r.number).toLowerCase().includes(q)) : base;

    const order: BuildingName[] = ["Main Building", "Building 2", "Building 3"];
    const byBuilding = new Map<BuildingName, RoomRow[]>();
    for (const name of order) byBuilding.set(name, []);

    for (const room of pool) {
      const bName = buildingForRoom(room.number);
      const list = byBuilding.get(bName) ?? [];
      list.push(room);
      byBuilding.set(bName, list);
    }

    return order
      .map((name) => {
        const list = byBuilding.get(name) ?? [];
        return {
          building: name,
          meta: BUILDING_META[name],
          rooms: list.sort((a, b) => {
            const priorityDiff = PRIORITY.indexOf(a.status) - PRIORITY.indexOf(b.status);
            if (priorityDiff !== 0) return priorityDiff;
            const aNum = parseInt(a.number, 10);
            const bNum = parseInt(b.number, 10);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            return a.number.localeCompare(b.number);
          }),
        };
      })
      .filter((g) => g.rooms.length > 0);
  }, [rooms, filter, staff.id, query]);

  const toClean = rooms.filter((r) => r.status === "vacant_dirty").length;
  const dnd = rooms.filter((r) => isDndActive(r)).length;
  const stayovers = rooms.filter((r) => isExtendedStay(r)).length;
  const mine = rooms.filter((r) => r.assigned_staff_id === staff.id);
  const mineLeft = mine.filter((r) => r.status === "vacant_dirty").length;
  const mineDone = mine.length - mineLeft;
  const active = rooms.find((r) => r.id === activeId) ?? null;

  const refreshSyncSummary = useCallback(() => {
    setSyncSummary(roomStatusQueueSummary());
  }, []);

  const flushQueuedRoomStatusChanges = useCallback(async () => {
    if (!isSupabaseConfigured) return { synced: 0, conflicts: 0 };
    let synced = 0;
    let conflicts = 0;
    for (const change of readQueuedRoomStatusChanges()) {
      if (change.state === "conflict") continue;
      const result = await syncQueuedRoomStatusChange(change);
      if (result === "synced") synced += 1;
      if (result === "conflict") conflicts += 1;
    }
    refreshSyncSummary();
    return { synced, conflicts };
  }, [refreshSyncSummary]);

  useEffect(() => {
    refreshSyncSummary();
    if (!isSupabaseConfigured) return;
    void flushQueuedRoomStatusChanges();
    const retry = () => void flushQueuedRoomStatusChanges();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [flushQueuedRoomStatusChanges, refreshSyncSummary]);

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
    const previous = allRooms;
    setAllRooms((prev) =>
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
    if (!isSupabaseConfigured) {
      setAllRooms(previous);
      toast.error("Live room status is unavailable. Please check the data connection.");
      return;
    }
    const { error } = await supabase.from("rooms").update(patch).eq("id", room.id);
    if (error) {
      setAllRooms(previous);
      toast.error("Couldn't update the assignment.");
      return;
    }
    toast.success(toMe ? `Room ${room.number} assigned to you` : `Room ${room.number} unassigned`);
  }

  /** Mark the transient cleaning stage (In Progress / Inspected). */
  async function setStage(room: RoomRow, stage: string | null) {
    if (!canTriage) {
      toast.error("A manager needs to grant you staff access first.");
      return;
    }
    const previous = allRooms;
    setAllRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, hk_stage: stage } : r)));
    if (!isSupabaseConfigured) {
      setAllRooms(previous);
      toast.error("Live room status is unavailable. Please check the data connection.");
      return;
    }
    const { error } = await supabase.from("rooms").update({ hk_stage: stage }).eq("id", room.id);
    if (error) {
      setAllRooms(previous);
      toast.error("Couldn't update that room.");
      return;
    }
    toast.success(
      stage === null
        ? `Room ${room.number} stage cleared`
        : `Room ${room.number} · ${stage === "in_progress" ? "In progress" : "Inspected"}`,
    );
  }

  /** Toggle the linen-change flag for a room. */
  async function toggleLinen(room: RoomRow) {
    if (!canTriage) return;
    const next = !room.linen_change;
    const previous = allRooms;
    setAllRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, linen_change: next } : r)));
    if (!isSupabaseConfigured) {
      setAllRooms(previous);
      toast.error("Live room status is unavailable. Please check the data connection.");
      return;
    }
    const { error } = await supabase.from("rooms").update({ linen_change: next }).eq("id", room.id);
    if (error) {
      setAllRooms(previous);
      toast.error("Couldn't update the linen flag.");
    }
  }

  /** Update persistent notes for a room. */
  async function saveNotes(room: RoomRow, notes: string) {
    if (!canTriage) return;
    const previous = allRooms;
    setAllRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, notes } : r)));
    if (!isSupabaseConfigured) {
      setAllRooms(previous);
      toast.error("Live room status is unavailable. Please check the data connection.");
      return;
    }
    const { error } = await supabase.from("rooms").update({ notes }).eq("id", room.id);
    if (error) {
      setAllRooms(previous);
      toast.error("Couldn't save notes.");
    } else {
      toast.success(`Notes saved for Room ${room.number}`);
    }
  }

  /** Quick status change from the housekeeping board. */
  async function setStatus(room: RoomRow, next: RoomStatus) {
    if (!canTriage) {
      toast.error("A manager needs to grant you staff access first.");
      return;
    }
    if (room.status === next) return;
    const previous = allRooms;
    setAllRooms((prev) =>
      prev.map((r) =>
        r.id === room.id ? { ...r, status: next, updated_at: new Date().toISOString() } : r,
      ),
    );
    if (!isSupabaseConfigured) {
      setAllRooms(previous);
      toast.error("Live room status is unavailable. Please check the data connection.");
      return;
    }

    const change = createQueuedRoomStatusChange({
      roomId: room.id,
      roomNumber: room.number,
      oldStatus: room.status,
      newStatus: next,
      expectedUpdatedAt: room.updated_at,
      staff,
    });
    enqueueRoomStatusChange(change);
    refreshSyncSummary();

    const result = await syncQueuedRoomStatusChange(change);
    refreshSyncSummary();
    if (result === "synced") {
      toast.success(`Room ${room.number} · ${STATUS_LABEL[next]} · ${staff.name}`);
      return;
    }

    setAllRooms(previous);
    if (result === "conflict") {
      toast.error("Room changed elsewhere. The live board was kept and this action needs review.");
      return;
    }
    toast.message("Room update saved on this device and will retry when you reconnect.");
  }

  async function markClean(room: RoomRow) {
    await setStatus(room, "vacant_clean");
  }

  return (
    <div className="ops-surface min-h-screen bg-ink px-3 pb-24 pt-4 text-cream sm:px-6 sm:pb-16 sm:pt-6">
      <header className="border-b border-cream/15 pb-4 sm:pb-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <BrandLockup tone="cream" />
            <p className="signage mt-4 flex items-center gap-2 text-cream/60 sm:mt-5">
              <span aria-hidden className="h-3 w-[3px] shrink-0 bg-amber" />
              <span className="truncate">Housekeeping · {staff.name}</span>
            </p>
            <h1 className="mt-2 truncate text-2xl sm:text-4xl">Rooms to turn</h1>
            <nav className="mt-3 flex flex-wrap gap-4">
              <Link
                to="/staff"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Staff queue
              </Link>
              <Link
                to="/front-desk"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Front desk
              </Link>
              <Link
                to="/"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Guest view
              </Link>
            </nav>
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

      {staff.id ? (
        <>
          <ShiftClock staff={{ id: staff.id, name: staff.name }} />
          <MySchedule staff={{ id: staff.id, name: staff.name }} supervisor={supervisor} />
        </>
      ) : null}

      <MaintenanceTicketsPanel reporter={staff.name} reporterStaffId={staff.id ?? null} />

      {syncSummary.pending || syncSummary.conflicts ? (
        <section
          className={`mt-4 border p-4 ${
            syncSummary.conflicts
              ? "border-status-dirty/70 bg-status-dirty/10"
              : "border-amber/50 bg-amber/10"
          }`}
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="signage text-cream">
                {syncSummary.pending
                  ? `${syncSummary.pending} room update${syncSummary.pending === 1 ? "" : "s"} waiting to sync`
                  : "Room update needs review"}
              </p>
              <p className="mt-1 text-sm text-cream/70">
                {syncSummary.conflicts
                  ? `${syncSummary.conflicts} update${syncSummary.conflicts === 1 ? "" : "s"} conflict with a newer room change. Refresh the room before trying again.`
                  : "Your changes are stored on this device and will retry when a connection is available."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-cream/35 bg-transparent text-cream hover:bg-cream/10"
              onClick={() => {
                void flushQueuedRoomStatusChanges().then(({ synced, conflicts }) => {
                  if (synced)
                    toast.success(`${synced} room update${synced === 1 ? "" : "s"} synced.`);
                  else if (conflicts) toast.error("A room changed elsewhere and needs review.");
                  else toast.message("Updates are still waiting for a connection.");
                });
              }}
            >
              Retry sync
            </Button>
          </div>
        </section>
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

      <section
        className="sticky top-0 z-20 -mx-3 mt-4 border-y border-cream/10 bg-ink/95 px-3 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6"
        aria-label="Housekeeping board controls"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Input
            value={query}
            inputMode="numeric"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a room number…"
            aria-label="Find a room number"
            className="h-11 max-w-xl border-cream/20 bg-cream/[0.04] text-base text-cream placeholder:text-cream/35"
          />
          <div
            className="flex snap-x gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] xl:overflow-visible xl:pb-0"
            role="group"
            aria-label="Room filters"
          >
            {(
              [
                ["all", "All rooms"],
                ["dirty", `Priority (${toClean})`],
                ["mine", `My rooms (${mine.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`signage shrink-0 snap-start rounded-lg border px-3.5 py-2.5 transition-colors duration-200 ${
                  filter === key
                    ? "border-amber bg-amber text-ink shadow-sm"
                    : "border-cream/20 bg-cream/[0.03] text-cream/65 hover:border-cream/40 hover:text-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Alerts">
            <button
              type="button"
              onClick={toggleAlerts}
              aria-pressed={alertsOn}
              className={`signage rounded-md border px-3 py-2 transition-colors duration-200 ${
                alertsOn
                  ? "border-status-clean/50 bg-status-clean/10 text-status-clean"
                  : "border-cream/20 text-cream/55 hover:text-cream"
              }`}
            >
              {alertsOn ? "Live alerts on" : "Live alerts off"}
            </button>
            {pushSupported() ? (
              <button
                type="button"
                onClick={() => void togglePush()}
                aria-pressed={pushOn}
                className={`signage rounded-md border px-3 py-2 transition-colors duration-200 ${
                  pushOn
                    ? "border-status-clean/50 bg-status-clean/10 text-status-clean"
                    : "border-cream/20 text-cream/55 hover:text-cream"
                }`}
              >
                {pushOn ? "Phone alerts on" : "Phone alerts off"}
              </button>
            ) : null}
          </div>

          <div
            className="flex items-center rounded-lg border border-cream/20 bg-cream/[0.04] p-1"
            role="group"
            aria-label="Board view"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              className={`signage rounded-md px-3 py-2 transition-colors duration-200 ${
                viewMode === "grid"
                  ? "bg-amber font-bold text-ink shadow-sm"
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("runner")}
              aria-pressed={viewMode === "runner"}
              className={`signage flex items-center gap-1.5 rounded-md px-3 py-2 transition-colors duration-200 ${
                viewMode === "runner"
                  ? "bg-amber font-bold text-ink shadow-sm"
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>Runner</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              aria-pressed={viewMode === "map"}
              className={`signage rounded-md px-3 py-2 transition-colors duration-200 ${
                viewMode === "map"
                  ? "bg-amber font-bold text-ink shadow-sm"
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              Property map
            </button>
          </div>
        </div>
      </section>

      {viewMode === "runner" ? (
        <HousekeepingRunner
          rooms={rooms}
          staff={staff}
          canTriage={canTriage}
          initialRoomId={activeId}
          openRequests={openIssues}
          onSetStatus={(room, next) => setStatus(room as RoomRow, next)}
          onSetStage={(room, stage) => setStage(room as RoomRow, stage)}
          onToggleLinen={(room) => toggleLinen(room as RoomRow)}
          onSaveNotes={(room, notes) => saveNotes(room as RoomRow, notes)}
          onReportIssue={(room) => setIssueRoom(room as RoomRow)}
          onClose={() => setViewMode("grid")}
        />
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-cream/50">Loading rooms…</p>
      ) : viewMode === "map" ? (
        <div className="mt-6">
          <FloorPlan
            floor={mapFloor}
            rooms={rooms}
            onFloorChange={setMapFloor}
            onSelect={(roomId) => setActiveId(roomId)}
          />
        </div>
      ) : buildings.length === 0 ? (
        <div className="mt-8 border border-cream/15 bg-cream/[0.03] p-6 text-center">
          <p className="signage text-cream/50">No rooms match</p>
          <p className="mt-2 text-sm text-cream/60">
            Clear the search or switch filters to see the rest of the board.
          </p>
        </div>
      ) : (
        buildings.map(({ building, meta, rooms: list }) => {
          const dirtyInBuilding = list.filter((r) => r.status === "vacant_dirty").length;
          return (
            <section key={building} className="mt-8">
              <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-cream/10 bg-ink/90 px-1 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="h-4 w-[3px] shrink-0 bg-amber" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="signage text-base font-medium text-cream">{building}</h2>
                      <span className="signage rounded border border-cream/15 bg-cream/[0.04] px-2 py-0.5 text-[0.65rem] text-cream/60">
                        {list.length} rooms
                      </span>
                      {dirtyInBuilding > 0 ? (
                        <span className="signage rounded bg-status-dirty/20 border border-status-dirty/40 px-2 py-0.5 text-[0.65rem] font-bold text-status-dirty">
                          {dirtyInBuilding} to turn
                        </span>
                      ) : (
                        <span className="signage rounded bg-status-clean/20 border border-status-clean/40 px-2 py-0.5 text-[0.65rem] text-status-clean">
                          All clean
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[0.7rem] text-cream/45">{meta.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(Object.keys(STATUS_LABEL) as RoomStatus[])
                    .map((s) => [s, list.filter((r) => r.status === s).length] as const)
                    .filter(([, n]) => n > 0)
                    .map(([s, n]) => (
                      <span
                        key={s}
                        className="signage flex shrink-0 items-center gap-1.5 rounded-full border border-cream/10 bg-cream/[0.03] px-2 py-0.5 text-[0.6rem] text-cream/60"
                      >
                        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
                        {STATUS_LABEL[s]} {n}
                      </span>
                    ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {list.map((room) => {
                  const mine = room.assigned_staff_id === staff.id;
                  const actionable = !room.assigned_staff_id || mine;
                  const needsTurn = room.status === "vacant_dirty";
                  const hasDnd = isDndActive(room);
                  const hasExtendedStay = isExtendedStay(room);
                  const stage = room.hk_stage
                    ? (STAGE_LABEL[room.hk_stage] ?? room.hk_stage)
                    : null;
                  return (
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
                      className={`group relative flex h-full min-h-[10.5rem] cursor-pointer touch-manipulation select-none flex-col overflow-hidden rounded-xl border p-3.5 pl-4 text-left shadow-sm transition-all duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-cream/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber ${STATUS_CARD[room.status]}`}
                    >
                      <span
                        aria-hidden
                        className={`absolute inset-y-0 left-0 w-[4px] ${STATUS_DOT[room.status]}`}
                      />
                      <span className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-3xl font-display leading-none tracking-tight text-cream">
                            {room.number}
                          </span>
                          <span className="block mt-1 text-[0.65rem] text-cream/50">
                            Floor {room.floor}
                          </span>
                        </div>
                        <span
                          className={`signage rounded-full border px-2 py-1 text-right text-[0.55rem] font-semibold leading-none ${STATUS_PILL[room.status]}`}
                        >
                          {STATUS_LABEL[room.status]}
                        </span>
                      </span>

                      <span className="mt-2.5 flex min-h-[1.5rem] flex-wrap items-center gap-1.5">
                        {hasDnd ? (
                          <span
                            className="signage flex items-center gap-1 rounded bg-status-dnd px-2 py-0.5 text-[0.62rem] font-bold text-white shadow-sm"
                            title="Do Not Disturb set — do not knock"
                          >
                            <Ban className="h-3 w-3 shrink-0" />
                            <span>DND</span>
                          </span>
                        ) : null}
                        {hasExtendedStay ? (
                          <span
                            className="signage flex items-center gap-1 rounded bg-amber px-2 py-0.5 text-[0.62rem] font-bold text-ink shadow-sm"
                            title="Extended Stay: Checkout date pushed later"
                          >
                            <RefreshCw className="h-3 w-3 shrink-0" />
                            <span>Extended Stay</span>
                          </span>
                        ) : null}
                        {stage ? (
                          <span className="signage rounded border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[0.6rem] text-sky-100">
                            {stage}
                          </span>
                        ) : null}
                        {room.linen_change ? (
                          <span className="signage rounded border border-amber/50 bg-amber/10 px-1.5 py-0.5 text-[0.6rem] text-amber">
                            Linens
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-2 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-cream/55">
                          {room.assigned_name
                            ? mine
                              ? "Assigned to you"
                              : `Assigned to ${room.assigned_name}`
                            : "Unassigned"}
                        </span>
                        <span className="shrink-0 text-cream/35">{stamp(room.updated_at)}</span>
                      </span>

                      <span className="mt-auto block pt-3">
                        {actionable && needsTurn ? (
                          <button
                            type="button"
                            disabled={!canTriage}
                            onClick={(e) => {
                              e.stopPropagation();
                              void markClean(room);
                            }}
                            className="signage flex min-h-11 w-full touch-manipulation items-center justify-center gap-1.5 rounded-lg bg-status-clean px-3 py-2 text-center text-[0.72rem] font-bold text-ink shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Mark clean</span>
                          </button>
                        ) : null}
                        <span
                          className={`grid gap-1.5 ${actionable && needsTurn ? "mt-1.5 grid-cols-2" : "grid-cols-1"}`}
                        >
                          {actionable ? (
                            <button
                              type="button"
                              disabled={!canTriage}
                              onClick={(e) => {
                                e.stopPropagation();
                                void setAssignment(room, !mine);
                              }}
                              className={`signage flex min-h-10 touch-manipulation items-center justify-center rounded-md border px-2 py-2 text-center text-[0.62rem] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                mine
                                  ? "border-cream/25 text-cream/60 hover:bg-cream/10 hover:text-cream"
                                  : "border-amber/60 text-amber hover:bg-amber hover:text-ink"
                              }`}
                            >
                              {mine ? "Release" : "Claim"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveId(room.id);
                            }}
                            className="signage flex min-h-10 touch-manipulation items-center justify-center rounded-md border border-cream/20 px-2 py-2 text-center text-[0.62rem] text-cream/65 transition-colors hover:border-cream/45 hover:bg-cream/10 hover:text-cream"
                          >
                            {actionable ? "Details & status" : "View details"}
                          </button>
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <Dialog open={!!active} onOpenChange={(open) => !open && setActiveId(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto border-cream/20 bg-ink text-cream">
          {active ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <DialogTitle className="text-3xl font-display">Room {active.number}</DialogTitle>
                  <span className="signage rounded border border-cream/20 bg-cream/[0.04] px-2 py-0.5 text-xs text-cream/70">
                    {buildingForRoom(active.number)} · Floor {active.floor}
                  </span>
                </div>
                <DialogDescription className="text-cream/60">
                  Updated {stamp(active.updated_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2">
                <p className={`signage ${STATUS_TEXT[active.status]}`}>
                  <span
                    aria-hidden
                    className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${STATUS_DOT[active.status]}`}
                  />
                  {STATUS_LABEL[active.status]}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {isDndActive(active) ? (
                  <div className="flex items-center gap-2 rounded-lg border border-status-dnd/60 bg-status-dnd/20 p-2.5 text-white">
                    <Ban className="h-4 w-4 shrink-0 text-status-dnd" />
                    <span className="text-xs font-semibold">
                      Do Not Disturb set — do not knock or enter.
                    </span>
                  </div>
                ) : null}
                {isExtendedStay(active) ? (
                  <div className="flex items-center gap-2 rounded-lg border border-amber/60 bg-amber/15 p-2.5 text-amber">
                    <RefreshCw className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold">
                      Extended Stay · Checkout extended to {active.check_out || "a later date"}.
                    </span>
                  </div>
                ) : null}
              </div>

              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="signage text-cream/45">Guest</dt>
                  <dd className="mt-1 text-cream/85 font-medium">{active.guest_name || "—"}</dd>
                </div>
                <div>
                  <dt className="signage text-cream/45">Checkout Date</dt>
                  <dd className="mt-1 text-cream/85">
                    {active.check_out || "—"}
                    {active.original_check_out && active.original_check_out !== active.check_out ? (
                      <span className="ml-2 text-xs text-cream/50">
                        (originally {active.original_check_out})
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="signage text-cream/45">Front desk notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-cream/85">
                    {active.notes || "No notes."}
                  </dd>
                </div>
              </dl>

              <div className="border border-cream/15 bg-cream/[0.03] p-3 rounded-lg">
                <p className="signage text-cream/45">Assigned to</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm text-cream/85">{active.assigned_name ?? "Unassigned"}</p>
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

              {openIssues.filter((i) => i.room === active.number).length ? (
                <div>
                  <p className="signage text-amber">Open issues</p>
                  <ul className="mt-2 space-y-3">
                    {openIssues
                      .filter((i) => i.room === active.number)
                      .map((issue) => (
                        <li
                          key={issue.id}
                          className="border border-cream/15 bg-cream/[0.03] px-3 py-2 rounded"
                        >
                          <p className="text-sm text-cream">
                            {issue.type} · {REQUEST_STATUS_LABEL[issue.status] ?? issue.status}
                          </p>
                          {issue.details ? (
                            <p className="mt-1 text-xs text-cream/65">{issue.details}</p>
                          ) : null}
                          <RequestWorkflowPanel request={issue} canEdit={canTriage} staff={staff} />
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              {!active.assigned_staff_id || active.assigned_staff_id === staff.id ? (
                <div>
                  <p className="signage text-cream/45">Update cleaning state</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {QUICK_STATUS.map((option) => (
                      <Button
                        key={option.status}
                        disabled={!canTriage || active.status === option.status}
                        onClick={() => {
                          void setStatus(active, option.status);
                          if (option.status === "vacant_clean") setActiveId(null);
                        }}
                        className={`h-12 text-base hover:opacity-90 ${option.className}`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <p className="signage mt-4 text-cream/45">Stage</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { value: null, label: "None" },
                      { value: "in_progress", label: "In progress" },
                      { value: "inspected", label: "Inspected" },
                    ].map((stage) => (
                      <Button
                        key={stage.label}
                        variant="outline"
                        disabled={!canTriage || (active.hk_stage ?? null) === stage.value}
                        onClick={() => void setStage(active, stage.value)}
                        className="h-11 border-cream/25 bg-transparent text-xs text-cream hover:bg-cream/10 hover:text-cream"
                      >
                        {stage.label}
                      </Button>
                    ))}
                  </div>
                  <label className="mt-4 flex items-center gap-2 text-sm text-cream/75">
                    <input
                      type="checkbox"
                      disabled={!canTriage}
                      checked={Boolean(active.linen_change)}
                      onChange={() => void toggleLinen(active)}
                    />
                    Linen change needed
                  </label>
                </div>
              ) : (
                <p className="text-xs text-cream/45">
                  Read-only — this room belongs to {active.assigned_name}.
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

      <IssueDialog room={issueRoom} staff={staff} onClose={() => setIssueRoom(null)} />

      {/* Mobile Floating Action Button to launch Runner Mode */}
      {viewMode !== "runner" ? (
        <button
          type="button"
          onClick={() => setViewMode("runner")}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-amber px-5 py-3.5 font-bold text-ink shadow-2xl transition-all active:scale-95 hover:bg-amber/90 sm:hidden"
          aria-label="Start runner mode"
        >
          <Footprints className="h-5 w-5" />
          <span>Runner ({toClean})</span>
        </button>
      ) : null}
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

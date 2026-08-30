import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useStaffRole } from "@/hooks/use-staff-role";
import type { StaffIdentity } from "@/lib/ops";
import {
  createQueuedRoomStatusChange,
  enqueueRoomStatusChange,
  readQueuedRoomStatusChanges,
  roomStatusQueueSummary,
} from "@/lib/room-status-sync";
import { syncQueuedRoomStatusChange } from "@/lib/room-status-sync-executor";
import {
  buildingForRoom,
  DB_STATUS_LABEL,
  isDndActive,
  isExtendedStay,
  type DbRoomStatus,
} from "@/lib/room-model";
import type { BuildingName } from "@/types/operations";
import type { Database } from "@/integrations/supabase/types";
import { useHousekeepingAlerts } from "./use-housekeeping-alerts";
import {
  BUILDING_META,
  CLEANING_PRIORITY,
  type BoardFilter,
  type IssueRow,
  type RoomRow,
} from "./types";

const ROOM_COLUMNS =
  "id, number, floor, bed_type, status, guest_name, check_out, original_check_out, notes, dnd, extended_stay, updated_at, assigned_staff_id, assigned_name, hk_stage, priority, linen_change";
const ISSUE_COLUMNS =
  "id, room, type, details, status, created_at, started_at, started_by_name, resolved_at, resolved_by_name";

const BUILDING_ORDER: BuildingName[] = ["Main Building", "Building 2", "Building 3"];

/** The columns an optimistic room write is allowed to set. */
type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"];

const OFFLINE_MESSAGE = "Live room status is unavailable. Please check the data connection.";
const NO_ACCESS_MESSAGE = "A manager needs to grant you staff access first.";

/**
 * The housekeeping board's data and every write it can make.
 *
 * Room writes are optimistic: state moves first and is rolled back to the
 * captured `previous` list if the write fails, so a housekeeper on a weak
 * corridor connection sees their tap land immediately.
 */
export function useHousekeepingBoard(
  staff: NonNullable<StaffIdentity>,
  filter: BoardFilter,
  query: string,
) {
  const [allRooms, setAllRooms] = useState<RoomRow[]>([]);
  const [openIssues, setOpenIssues] = useState<IssueRow[]>([]);
  const [supervisor, setSupervisor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncSummary, setSyncSummary] = useState({ pending: 0, conflicts: 0 });
  const { canTriage, loading: roleLoading } = useStaffRole();
  const alerts = useHousekeepingAlerts(staff);

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

  useRealtimeRefresh({
    channel: "housekeeping-feed",
    tables: ["rooms", "requests", "room_status_events"],
    onEvent: alerts.handleRoomEvent,
    onRefresh: async (signal) => {
      const [roomRes, issueRes] = await Promise.all([
        supabase.from("rooms").select(ROOM_COLUMNS).order("number"),
        supabase
          .from("requests")
          .select(ISSUE_COLUMNS)
          .neq("status", "done")
          .order("created_at", { ascending: false }),
      ]);
      if (signal.cancelled) return;
      if (roomRes.error) toast.error("Couldn't load rooms.");
      setAllRooms((roomRes.data ?? []) as RoomRow[]);
      setOpenIssues((issueRes.data ?? []) as IssueRow[]);
      setLoading(false);
    },
  });

  // Regular housekeepers only see their own rooms plus anything unassigned.
  // Supervisors see the full board and who is cleaning what.
  const rooms = useMemo(
    () =>
      supervisor
        ? allRooms
        : allRooms.filter((r) => !r.assigned_staff_id || r.assigned_staff_id === staff.id),
    [allRooms, supervisor, staff.id],
  );

  const buildings = useMemo(() => {
    const base =
      filter === "dirty"
        ? rooms.filter((r) => r.status === "vacant_dirty")
        : filter === "mine"
          ? rooms.filter((r) => r.assigned_staff_id === staff.id)
          : rooms;
    const q = query.trim().toLowerCase();
    const pool = q ? base.filter((r) => String(r.number).toLowerCase().includes(q)) : base;

    const byBuilding = new Map<BuildingName, RoomRow[]>();
    for (const name of BUILDING_ORDER) byBuilding.set(name, []);
    for (const room of pool) {
      const name = buildingForRoom(room.number);
      byBuilding.get(name)?.push(room);
    }

    return BUILDING_ORDER.map((name) => ({
      building: name,
      meta: BUILDING_META[name],
      rooms: (byBuilding.get(name) ?? []).sort((a, b) => {
        const priorityDiff =
          CLEANING_PRIORITY.indexOf(a.status) - CLEANING_PRIORITY.indexOf(b.status);
        if (priorityDiff !== 0) return priorityDiff;
        const aNum = parseInt(a.number, 10);
        const bNum = parseInt(b.number, 10);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.number.localeCompare(b.number);
      }),
    })).filter((g) => g.rooms.length > 0);
  }, [rooms, filter, staff.id, query]);

  const mine = useMemo(
    () => rooms.filter((r) => r.assigned_staff_id === staff.id),
    [rooms, staff.id],
  );
  const counts = useMemo(() => {
    const mineLeft = mine.filter((r) => r.status === "vacant_dirty").length;
    return {
      toClean: rooms.filter((r) => r.status === "vacant_dirty").length,
      dnd: rooms.filter((r) => isDndActive(r)).length,
      stayovers: rooms.filter((r) => isExtendedStay(r)).length,
      mineTotal: mine.length,
      mineLeft,
      mineDone: mine.length - mineLeft,
    };
  }, [rooms, mine]);

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

  /**
   * Apply an optimistic patch, run the write, and roll back on failure.
   * Returns false when the write did not land.
   */
  const patchRoom = useCallback(
    async (room: RoomRow, local: Partial<RoomRow>, remote: RoomUpdate, failure: string) => {
      const previous = allRooms;
      setAllRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, ...local } : r)));
      if (!isSupabaseConfigured) {
        setAllRooms(previous);
        toast.error(OFFLINE_MESSAGE);
        return false;
      }
      const { error } = await supabase.from("rooms").update(remote).eq("id", room.id);
      if (error) {
        setAllRooms(previous);
        toast.error(failure);
        return false;
      }
      return true;
    },
    [allRooms],
  );

  const setAssignment = useCallback(
    async (room: RoomRow, toMe: boolean) => {
      if (!canTriage) {
        toast.error(NO_ACCESS_MESSAGE);
        return;
      }
      const remote = toMe
        ? {
            assigned_staff_id: staff.id,
            assigned_name: staff.name,
            assigned_at: new Date().toISOString(),
          }
        : { assigned_staff_id: null, assigned_name: null, assigned_at: null };
      const ok = await patchRoom(
        room,
        { assigned_staff_id: remote.assigned_staff_id, assigned_name: remote.assigned_name },
        remote,
        "Couldn't update the assignment.",
      );
      if (ok) {
        toast.success(
          toMe ? `Room ${room.number} assigned to you` : `Room ${room.number} unassigned`,
        );
      }
    },
    [canTriage, patchRoom, staff.id, staff.name],
  );

  /** Mark the transient cleaning stage (In Progress / Inspected). */
  const setStage = useCallback(
    async (room: RoomRow, stage: string | null) => {
      if (!canTriage) {
        toast.error(NO_ACCESS_MESSAGE);
        return;
      }
      const ok = await patchRoom(
        room,
        { hk_stage: stage },
        { hk_stage: stage },
        "Couldn't update that room.",
      );
      if (!ok) return;
      toast.success(
        stage === null
          ? `Room ${room.number} stage cleared`
          : `Room ${room.number} · ${stage === "in_progress" ? "In progress" : "Inspected"}`,
      );
    },
    [canTriage, patchRoom],
  );

  const toggleLinen = useCallback(
    async (room: RoomRow) => {
      if (!canTriage) return;
      const next = !room.linen_change;
      await patchRoom(
        room,
        { linen_change: next },
        { linen_change: next },
        "Couldn't update the linen flag.",
      );
    },
    [canTriage, patchRoom],
  );

  const saveNotes = useCallback(
    async (room: RoomRow, notes: string) => {
      if (!canTriage) return;
      const ok = await patchRoom(room, { notes }, { notes }, "Couldn't save notes.");
      if (ok) toast.success(`Notes saved for Room ${room.number}`);
    },
    [canTriage, patchRoom],
  );

  /**
   * Quick status change. Unlike the other writes this goes through the offline
   * queue, so it survives a dropped connection and is rejected if the room
   * changed elsewhere first.
   */
  const setStatus = useCallback(
    async (room: RoomRow, next: DbRoomStatus) => {
      if (!canTriage) {
        toast.error(NO_ACCESS_MESSAGE);
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
        toast.error(OFFLINE_MESSAGE);
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
        toast.success(`Room ${room.number} · ${DB_STATUS_LABEL[next]} · ${staff.name}`);
        return;
      }

      setAllRooms(previous);
      if (result === "conflict") {
        toast.error(
          "Room changed elsewhere. The live board was kept and this action needs review.",
        );
        return;
      }
      toast.message("Room update saved on this device and will retry when you reconnect.");
    },
    [allRooms, canTriage, refreshSyncSummary, staff],
  );

  return {
    rooms,
    openIssues,
    buildings,
    counts,
    loading,
    supervisor,
    canTriage,
    roleLoading,
    syncSummary,
    flushQueuedRoomStatusChanges,
    setAssignment,
    setStage,
    setStatus,
    toggleLinen,
    saveNotes,
    alerts,
  };
}

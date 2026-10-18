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

/** Outcome of a status write; only "synced" means the live board changed. */
export type StatusResult = "synced" | "conflict" | "queued" | "error" | "denied";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState({ pending: 0, conflicts: 0 });
  const { canTriage, isFrontDesk, loading: roleLoading } = useStaffRole();
  const alerts = useHousekeepingAlerts(staff);

  useEffect(() => {
    let active = true;
    async function loadSupervisor() {
      setSupervisor(isFrontDesk);
      if (isFrontDesk) return;
      try {
        // Resolve authority from the authenticated account, never the selected roster name.
        const { data, error } = await supabase.rpc("is_supervisor");
        if (active) setSupervisor(!error && data === true);
      } catch {
        if (active) setSupervisor(false);
      }
    }
    void loadSupervisor();
    return () => {
      active = false;
    };
  }, [isFrontDesk]);

  useRealtimeRefresh({
    channel: "housekeeping-feed",
    tables: ["rooms", "requests"],
    onEvent: alerts.handleRoomEvent,
    onRefresh: async (signal) => {
      try {
        const [roomRes, issueRes] = await Promise.all([
          supabase.from("rooms").select(ROOM_COLUMNS).order("number"),
          supabase
            .from("requests")
            .select(ISSUE_COLUMNS)
            .neq("status", "done")
            .order("created_at", { ascending: false }),
        ]);
        if (signal.cancelled) return;
        // A failed refresh must not erase the last successfully loaded board.
        if (!roomRes.error) setAllRooms((roomRes.data ?? []) as RoomRow[]);
        if (!issueRes.error) setOpenIssues((issueRes.data ?? []) as IssueRow[]);
        setLoadError(
          roomRes.error || issueRes.error ? "Some housekeeping data could not be refreshed." : null,
        );
      } catch {
        if (!signal.cancelled) setLoadError("The housekeeping connection could not be reached.");
      } finally {
        if (!signal.cancelled) setLoading(false);
      }
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
      mineDone: mine.filter((r) => r.status === "vacant_clean").length,
    };
  }, [rooms, mine]);

  const refreshRoom = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(ROOM_COLUMNS)
        .eq("id", roomId)
        .maybeSingle();
      if (error) throw error;
      setAllRooms((current) =>
        data
          ? current.map((room) => (room.id === roomId ? (data as RoomRow) : room))
          : current.filter((room) => room.id !== roomId),
      );
      return true;
    } catch {
      setLoadError(
        "A room update could not be refreshed. Wait for the board to reconnect before making another change.",
      );
      return false;
    }
  }, []);

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
      if (result === "synced" || result === "conflict") await refreshRoom(change.roomId);
      if (result === "synced") synced += 1;
      if (result === "conflict") conflicts += 1;
    }
    refreshSyncSummary();
    return { synced, conflicts };
  }, [refreshRoom, refreshSyncSummary]);

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
      // Only this room's changed fields are rolled back, so a concurrent
      // realtime update to other rooms (or other fields) is never clobbered.
      const before = allRooms.find((r) => r.id === room.id);
      const restore = () =>
        setAllRooms((prev) =>
          prev.map((r) => {
            if (r.id !== room.id || !before || r.updated_at !== before.updated_at) return r;
            const back: Partial<RoomRow> = {};
            for (const key of Object.keys(local) as (keyof RoomRow)[]) {
              if (r[key] === local[key]) (back as Record<string, unknown>)[key] = before[key];
            }
            return { ...r, ...back };
          }),
        );
      setAllRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, ...local } : r)));
      if (!isSupabaseConfigured) {
        restore();
        toast.error(OFFLINE_MESSAGE);
        return false;
      }
      try {
        const { data, error } = await supabase
          .from("rooms")
          .update(remote)
          .eq("id", room.id)
          .eq("updated_at", room.updated_at)
          .select("id, updated_at");
        if (error || !data?.length) {
          restore();
          await refreshRoom(room.id);
          toast.error(
            data && !data.length
              ? "Room changed or access was denied. Review the refreshed room and try again."
              : failure,
          );
          return false;
        }
        const updatedAt = data[0]?.updated_at;
        if (updatedAt) {
          setAllRooms((prev) =>
            prev.map((r) => (r.id === room.id ? { ...r, updated_at: updatedAt } : r)),
          );
        }
        return true;
      } catch {
        restore();
        toast.error(failure);
        return false;
      }
    },
    [allRooms, refreshRoom],
  );

  const setAssignment = useCallback(
    async (room: RoomRow, toMe: boolean) => {
      if (!canTriage) {
        toast.error(NO_ACCESS_MESSAGE);
        return;
      }
      if (room.assigned_staff_id && room.assigned_staff_id !== staff.id && !supervisor) {
        toast.error("This room is assigned to someone else.");
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
        {
          assigned_staff_id: remote.assigned_staff_id,
          assigned_name: remote.assigned_name,
        },
        remote,
        "Couldn't update the assignment.",
      );
      if (ok) {
        toast.success(
          toMe ? `Room ${room.number} assigned to you` : `Room ${room.number} unassigned`,
        );
      }
    },
    [canTriage, patchRoom, staff.id, staff.name, supervisor],
  );

  /** Mark the transient cleaning stage (In Progress / Inspected). */
  const setStage = useCallback(
    async (room: RoomRow, stage: string | null) => {
      if (!canTriage) {
        toast.error(NO_ACCESS_MESSAGE);
        return false;
      }
      if (room.assigned_staff_id && room.assigned_staff_id !== staff.id && !supervisor) {
        toast.error("This room is assigned to someone else.");
        return false;
      }
      const ok = await patchRoom(
        room,
        { hk_stage: stage },
        { hk_stage: stage },
        "Couldn't update that room.",
      );
      if (!ok) return false;
      toast.success(
        stage === null
          ? `Room ${room.number} stage cleared`
          : `Room ${room.number} · ${stage === "in_progress" ? "In progress" : "Inspected"}`,
      );
      return true;
    },
    [canTriage, patchRoom, staff.id, supervisor],
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
    async (room: RoomRow, next: DbRoomStatus): Promise<StatusResult> => {
      if (!canTriage) {
        toast.error(NO_ACCESS_MESSAGE);
        return "denied";
      }
      if (room.assigned_staff_id && room.assigned_staff_id !== staff.id && !supervisor) {
        toast.error("This room is assigned to someone else.");
        return "denied";
      }
      if (room.status === next && !(next === "vacant_clean" && room.hk_stage)) return "synced";
      const before = { status: room.status, updated_at: room.updated_at };
      const restore = () =>
        setAllRooms((prev) =>
          prev.map((r) =>
            r.id === room.id && r.updated_at === before.updated_at && r.status === next
              ? { ...r, ...before }
              : r,
          ),
        );
      setAllRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, status: next } : r)));
      if (!isSupabaseConfigured) {
        restore();
        toast.error(OFFLINE_MESSAGE);
        return "error";
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
        await refreshRoom(room.id);
        toast.success(`Room ${room.number} · ${DB_STATUS_LABEL[next]} · ${staff.name}`);
        return "synced";
      }

      restore();
      if (result === "conflict") {
        const refreshed = await refreshRoom(room.id);
        toast.error(
          refreshed
            ? "Room changed elsewhere. Review the refreshed room before trying again."
            : "Room changed elsewhere. Could not refresh it yet; wait for the connection to recover.",
        );
        return "conflict";
      }
      toast.message("Not saved yet — this device will retry when you reconnect.");
      return "queued";
    },
    [canTriage, refreshRoom, refreshSyncSummary, staff, supervisor],
  );

  return {
    rooms,
    openIssues,
    buildings,
    counts,
    loading,
    loadError,
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

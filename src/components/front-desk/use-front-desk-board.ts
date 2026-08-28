import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useStaffRole } from "@/hooks/use-staff-role";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import {
  average,
  startOfToday,
  todayIso,
  type RoomStatusEvent,
  type StaffIdentity,
} from "@/lib/ops";
import {
  createQueuedRoomStatusChange,
  enqueueRoomStatusChange,
  readQueuedRoomStatusChanges,
  roomStatusQueueSummary,
} from "@/lib/room-status-sync";
import { syncQueuedRoomStatusChange } from "@/lib/room-status-sync-executor";
import { DB_STATUS_ORDER, type DbRoomStatus } from "@/lib/room-model";
import type { BookingRow, RequestRow, RoomPatch, RoomRow } from "./types";

const ROOM_COLUMNS =
  "id, number, floor, bed_type, status, guest_name, check_in, check_out, notes, wing, side, guest_status, hk_stage, priority, linen_change, updated_at";
const REQUEST_COLUMNS =
  "id, room, type, details, status, created_at, started_at, started_by_name, resolved_at, resolved_by_name";
const EVENT_COLUMNS =
  "id, room_number, old_status, new_status, staff_name, duration_seconds, is_turnover, changed_at";

/** Tables whose changes should pull a fresh board. */
const LIVE_TABLES = ["rooms", "requests", "bookings", "room_status_events"];

function groupBy<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(key(row)) ?? [];
    list.push(row);
    map.set(key(row), list);
  }
  return map;
}

/**
 * All of the front-desk board's data: the live tables, everything derived from
 * them, and the room write path with its offline queue.
 */
export function useFrontDeskBoard() {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [events, setEvents] = useState<RoomStatusEvent[]>([]);
  const [resolvedToday, setResolvedToday] = useState<
    { id: string; response_seconds: number | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [syncSummary, setSyncSummary] = useState({ pending: 0, conflicts: 0 });
  const { canTriage, loading: roleLoading } = useStaffRole();
  const { members, staff, select, addMember } = useStaffIdentity();
  const day = todayIso();
  const dayStart = startOfToday();

  useRealtimeRefresh({
    channel: "front-desk-feed",
    tables: LIVE_TABLES,
    onRefresh: async (signal) => {
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string,
        args?: Record<string, unknown>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) => any;
      const [roomRes, reqRes, bookRes, eventRes, resolvedRes] = await Promise.all([
        rpc("rooms_board").select(ROOM_COLUMNS).order("number"),
        rpc("requests_board")
          .select(REQUEST_COLUMNS)
          .neq("status", "done")
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("id, guest_name, room, phone, check_in, check_out, notes")
          .order("check_in"),
        supabase
          .from("room_status_events")
          .select(EVENT_COLUMNS)
          .order("changed_at", { ascending: false })
          .limit(500),
        rpc("requests_board").select("id, response_seconds").gte("resolved_at", startOfToday()),
      ]);
      if (signal.cancelled) return;
      if (roomRes.error) toast.error("Couldn't load the room board.");
      setRooms((roomRes.data ?? []) as RoomRow[]);
      setRequests((reqRes.data ?? []) as RequestRow[]);
      setBookings((bookRes.data ?? []) as BookingRow[]);
      setEvents((eventRes.data ?? []) as RoomStatusEvent[]);
      setResolvedToday(
        (resolvedRes.data ?? []) as { id: string; response_seconds: number | null }[],
      );
      setLoading(false);
    },
  });

  const counts = useMemo(
    () =>
      DB_STATUS_ORDER.reduce(
        (acc, status) => {
          acc[status] = rooms.filter((room) => room.status === status).length;
          return acc;
        },
        {} as Record<DbRoomStatus, number>,
      ),
    [rooms],
  );

  const occupancy = useMemo(() => {
    const sellable = rooms.filter((r) => r.status !== "out_of_order").length;
    const taken = rooms.filter(
      (r) => r.status === "occupied" || r.status === "occupied_dnd",
    ).length;
    return sellable ? Math.round((taken / sellable) * 100) : 0;
  }, [rooms]);

  const arrivals = useMemo(() => bookings.filter((b) => b.check_in === day), [bookings, day]);
  const departures = useMemo(() => bookings.filter((b) => b.check_out === day), [bookings, day]);

  const requestsByRoom = useMemo(() => groupBy(requests, (req) => req.room), [requests]);
  const eventsByRoom = useMemo(() => groupBy(events, (event) => event.room_number), [events]);

  const openCountByRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const [room, list] of requestsByRoom) map.set(room, list.length);
    return map;
  }, [requestsByRoom]);

  const avgTurnover = useMemo(
    () =>
      average(
        events
          .filter((e) => e.is_turnover && e.duration_seconds != null && e.changed_at >= dayStart)
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

  const saveRoom = useCallback(
    async (room: RoomRow, patch: RoomPatch) => {
      if (!canTriage) {
        toast.error("You don't have permission to update rooms.");
        return;
      }
      const previous = rooms;
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r,
        ),
      );
      if (!isSupabaseConfigured) {
        setRooms(previous);
        toast.error("Live room status is unavailable. Please check the data connection.");
        return;
      }

      // Status changes go through the offline queue so they survive a dropped
      // connection and are checked against a concurrent edit before landing.
      if (patch.status && patch.status !== room.status) {
        if (!staff) {
          setRooms(previous);
          toast.error("Select the staff member on desk before changing a room status.");
          return;
        }

        const change = createQueuedRoomStatusChange({
          roomId: room.id,
          roomNumber: room.number,
          oldStatus: room.status,
          newStatus: patch.status,
          expectedUpdatedAt: room.updated_at,
          staff,
        });
        enqueueRoomStatusChange(change);
        refreshSyncSummary();

        const result = await syncQueuedRoomStatusChange(change);
        refreshSyncSummary();
        if (result === "synced") {
          toast.success(
            staff ? `Room ${room.number} updated by ${staff.name}` : `Room ${room.number} updated`,
          );
          return;
        }

        setRooms(previous);
        if (result === "conflict") {
          toast.error(
            "Room changed elsewhere. The live board was kept and this action needs review.",
          );
          return;
        }
        toast.message("Room update saved on this device and will retry when you reconnect.");
        return;
      }

      const { error } = await supabase.from("rooms").update(patch).eq("id", room.id);
      if (error) {
        setRooms(previous);
        toast.error("Couldn't update that room.");
        return;
      }

      toast.success(
        staff ? `Room ${room.number} updated by ${staff.name}` : `Room ${room.number} updated`,
      );
    },
    [canTriage, rooms, staff, refreshSyncSummary],
  );

  return {
    rooms,
    requests,
    bookings,
    loading,
    counts,
    occupancy,
    arrivals,
    departures,
    requestsByRoom,
    eventsByRoom,
    openCountByRoom,
    avgTurnover,
    avgResponse,
    syncSummary,
    flushQueuedRoomStatusChanges,
    saveRoom,
    canTriage,
    roleLoading,
    staff: staff as StaffIdentity,
    members,
    selectStaff: select,
    addMember,
  };
}

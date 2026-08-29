import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { advanceRequest } from "@/lib/request-workflow";
import type { StaffIdentity } from "@/lib/ops";
import type { MapRoom } from "@/components/floor-plan";
import type { RequestRow } from "./types";

/** A map room plus the housekeeping fields the live pins fold in. */
export type QueueRoom = MapRoom & {
  dnd?: boolean | null;
  hk_stage?: string | null;
  updated_at?: string | null;
};

const REQUEST_COLUMNS =
  "id, room, guest_name, type, details, status, created_at, started_at, started_by_name, resolved_at, resolved_by_name";

/** The live request queue plus the room list the property map renders. */
export function useRequestQueue(canTriage: boolean, staff: StaffIdentity) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [rooms, setRooms] = useState<QueueRoom[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useRealtimeRefresh({
    channel: "requests-feed",
    // Rooms ride the same feed so the stat strip and watch chips stay in step
    // with the queue instead of showing counts from page load.
    tables: ["requests", "rooms", "room_status_events"],
    onRefresh: async (signal) => {
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string,
        args?: Record<string, unknown>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) => any;
      const [requestRes, roomRes] = await Promise.all([
        rpc("requests_board").select(REQUEST_COLUMNS).order("created_at", { ascending: false }),
        supabase.from("rooms").select("id, number, floor, status, guest_name, dnd, hk_stage, updated_at").order("number"),
      ]);
      if (signal.cancelled) return;
      if (requestRes.error) {
        toast.error("Couldn't load the queue.");
      } else {
        setRows((requestRes.data ?? []) as RequestRow[]);
      }
      if (roomRes.data) {
        setRooms(
          roomRes.data.map((r) => ({
            id: r.id,
            number: r.number,
            status: (r.status ?? "vacant_clean") as MapRoom["status"],
            guest_name: r.guest_name,
            dnd: r.dnd,
            hk_stage: r.hk_stage,
            updated_at: r.updated_at,
          })),
        );
      }
    },
  });

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.status === filter)),
    [rows, filter],
  );

  const counts = useMemo(
    () => ({
      new: rows.filter((row) => row.status === "new").length,
      in_progress: rows.filter((row) => row.status === "in_progress").length,
      done: rows.filter((row) => row.status === "done").length,
    }),
    [rows],
  );

  const openCount = useMemo(() => rows.filter((r) => r.status !== "done").length, [rows]);

  const openRequestsByRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.status !== "done") map.set(r.room, (map.get(r.room) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const requestsForRoom = useCallback(
    (roomNumber: string | undefined) =>
      roomNumber ? rows.filter((r) => r.room === roomNumber) : [],
    [rows],
  );

  const setStatus = useCallback(
    async (id: string, status: string) => {
      if (!canTriage) {
        toast.error("You don't have permission to triage requests.");
        return;
      }
      const previous = rows;
      const row = previous.find((r) => r.id === id);
      if (!row) return;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      const { error, updated } = await advanceRequest(row, status, staff ?? null);
      if (error && !updated) {
        setRows(previous);
        toast.error("Update failed — your role may not allow this.");
      } else if (error) {
        toast.warning("Request status updated, but its timeline entry could not be saved.");
      }
    },
    [canTriage, rows, staff],
  );

  return {
    rows,
    rooms,
    visible,
    counts,
    openCount,
    openRequestsByRoom,
    requestsForRoom,
    filter,
    setFilter,
    setStatus,
  };
}

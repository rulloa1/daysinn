import { supabase } from "@/integrations/supabase/client";
import {
  removeQueuedRoomStatusChange,
  updateQueuedRoomStatusChange,
  type QueuedRoomStatusChange,
} from "./room-status-sync";

type ApplyRoomStatusResult = {
  outcome: "synced" | "conflict";
  current_status: string;
  current_updated_at: string;
};

type RpcClient = (
  functionName: string,
  args: Record<string, unknown>,
) => Promise<{ data: ApplyRoomStatusResult[] | null; error: { message: string } | null }>;

/**
 * Sends one persisted room-status action to the database. The server verifies the
 * displayed room version, updates the room, and writes its audit event atomically.
 */
export async function syncQueuedRoomStatusChange(
  change: QueuedRoomStatusChange,
): Promise<"synced" | "conflict" | "error"> {
  const attempts = change.attempts + 1;
  if (!change.staff) {
    updateQueuedRoomStatusChange(change.id, {
      state: "error",
      attempts,
      lastAttemptAt: new Date().toISOString(),
      lastError: "A live room-status change requires a selected staff identity.",
    });
    return "error";
  }

  updateQueuedRoomStatusChange(change.id, {
    state: "pending",
    attempts,
    lastAttemptAt: new Date().toISOString(),
    lastError: null,
  });

  const rpc = supabase.rpc.bind(supabase) as unknown as RpcClient;
  const { data, error } = await rpc("apply_room_status_change", {
    p_operation_id: change.id,
    p_room_id: change.roomId,
    p_expected_updated_at: change.expectedUpdatedAt,
    p_new_status: change.newStatus,
    p_staff_member_id: change.staff.id,
    p_staff_name: change.staff.name,
    p_changed_at: change.createdAt,
  });

  if (error) {
    updateQueuedRoomStatusChange(change.id, {
      state: "error",
      attempts,
      lastAttemptAt: new Date().toISOString(),
      lastError: error.message,
    });
    return "error";
  }

  const result = data?.[0];
  if (result?.outcome === "synced") {
    removeQueuedRoomStatusChange(change.id);
    return "synced";
  }

  if (result?.outcome === "conflict") {
    updateQueuedRoomStatusChange(change.id, {
      state: "conflict",
      attempts,
      lastAttemptAt: new Date().toISOString(),
      lastError: "A newer room update is already recorded on the live board.",
    });
    return "conflict";
  }

  updateQueuedRoomStatusChange(change.id, {
    state: "error",
    attempts,
    lastAttemptAt: new Date().toISOString(),
    lastError: "The live room-status service returned an unexpected response.",
  });
  return "error";
}

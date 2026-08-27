import { supabase } from "@/integrations/supabase/client";
import {
  readQueuedRoomStatusChanges,
  writeQueuedRoomStatusChanges,
  type QueuedRoomStatusChange,
} from "./room-status-sync";

/**
 * Attempts to sync a single queued change to Supabase.
 * Returns 'synced', 'conflict', or 'error'.
 */
export async function syncQueuedRoomStatusChange(
  change: QueuedRoomStatusChange,
): Promise<"synced" | "conflict" | "error"> {
  if (!supabase) return "error";

  try {
    // 1. Fetch the latest room state to check for conflicts
    const { data: room, error: fetchError } = await supabase
      .from("rooms")
      .select("updated_at")
      .eq("id", change.roomId)
      .single();

    if (fetchError) {
      console.error("Error fetching room for sync:", fetchError);
      return "error";
    }

    // 2. Conflict check
    if (room.updated_at && room.updated_at !== change.expectedUpdatedAt) {
      // Conflict: The room was updated by someone else while this device was offline/syncing
      const queue = readQueuedRoomStatusChanges();
      const idx = queue.findIndex((c) => c.id === change.id);
      if (idx !== -1) {
        queue[idx].state = "conflict";
        writeQueuedRoomStatusChanges(queue);
      }
      return "conflict";
    }

    // 3. Apply the update
    const { error: updateError } = await supabase
      .from("rooms")
      .update({ status: change.newStatus })
      .eq("id", change.roomId);

    if (updateError) {
      console.error("Error updating room status:", updateError);
      return "error";
    }

    // 4. Log the event if staff info was provided
    if (change.staff) {
      await supabase.from("room_status_events").insert({
        room_number: change.roomNumber,
        old_status: change.oldStatus,
        new_status: change.newStatus,
        staff_name: change.staff.name,
        changed_at: new Date().toISOString(),
      });
    }

    // 5. Success - remove from queue
    const queue = readQueuedRoomStatusChanges();
    const updatedQueue = queue.filter((item) => item.id !== change.id);
    writeQueuedRoomStatusChanges(updatedQueue);

    return "synced";
  } catch (error) {
    console.error("Failed to sync queued change:", error);
    return "error";
  }
}

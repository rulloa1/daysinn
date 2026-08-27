import type { StaffIdentity } from "./ops";

export type QueuedRoomStatusChange = {
  id: string; // random local ID
  roomId: string;
  roomNumber: string;
  oldStatus: string;
  newStatus: string;
  expectedUpdatedAt: string; // use to check for conflicts
  staff?: StaffIdentity | null;
  state: "pending" | "conflict" | "error";
  timestamp: string;
};

const QUEUE_KEY = "offline_room_status_queue";

export function readQueuedRoomStatusChanges(): QueuedRoomStatusChange[] {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function writeQueuedRoomStatusChanges(queue: QueuedRoomStatusChange[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to write room status queue", e);
  }
}

export function createQueuedRoomStatusChange(args: {
  roomId: string;
  roomNumber: string;
  oldStatus: string;
  newStatus: string;
  expectedUpdatedAt: string;
  staff?: StaffIdentity | null;
}): QueuedRoomStatusChange {
  return {
    ...args,
    id: Math.random().toString(36).substring(7),
    state: "pending",
    timestamp: new Date().toISOString(),
  };
}

export function enqueueRoomStatusChange(change: QueuedRoomStatusChange) {
  const queue = readQueuedRoomStatusChanges();
  queue.push(change);
  writeQueuedRoomStatusChanges(queue);
}

export function roomStatusQueueSummary() {
  const queue = readQueuedRoomStatusChanges();
  return {
    pending: queue.filter((c) => c.state === "pending").length,
    conflicts: queue.filter((c) => c.state === "conflict").length,
    latest: queue.length > 0 ? queue[queue.length - 1] : null,
  };
}

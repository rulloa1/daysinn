import type { StaffIdentity } from "./ops";

export type RoomStatusValue =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "reserved" | "out_of_order";

export type QueuedRoomStatusChange = {
  id: string;
  roomId: string;
  roomNumber: string;
  oldStatus: RoomStatusValue;
  newStatus: RoomStatusValue;
  expectedUpdatedAt: string;
  staff: StaffIdentity;
  createdAt: string;
  state: "pending" | "conflict" | "error";
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
};

export type RoomStatusQueueSummary = {
  pending: number;
  conflicts: number;
  latest: QueuedRoomStatusChange | null;
};

export const ROOM_STATUS_QUEUE_KEY = "daysinn.room-status.queue.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `status-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRoomStatus(value: unknown): value is RoomStatusValue {
  return (
    typeof value === "string" &&
    [
      "vacant_clean",
      "vacant_dirty",
      "occupied",
      "occupied_dnd",
      "reserved",
      "out_of_order",
    ].includes(value)
  );
}

function isQueuedRoomStatusChange(value: unknown): value is QueuedRoomStatusChange {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QueuedRoomStatusChange>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.roomId === "string" &&
    typeof candidate.roomNumber === "string" &&
    isRoomStatus(candidate.oldStatus) &&
    isRoomStatus(candidate.newStatus) &&
    typeof candidate.expectedUpdatedAt === "string" &&
    Boolean(
      candidate.staff &&
      typeof candidate.staff.id === "string" &&
      typeof candidate.staff.name === "string",
    ) &&
    typeof candidate.createdAt === "string" &&
    (candidate.state === "pending" ||
      candidate.state === "conflict" ||
      candidate.state === "error") &&
    typeof candidate.attempts === "number"
  );
}

function writeQueue(queue: QueuedRoomStatusChange[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(ROOM_STATUS_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Local persistence can fail in private or storage-constrained browsers. The UI
    // still reports the server response and never pretends that an unsaved action synced.
  }
}

export function readQueuedRoomStatusChanges(): QueuedRoomStatusChange[] {
  if (!canUseStorage()) return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(ROOM_STATUS_QUEUE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isQueuedRoomStatusChange) : [];
  } catch {
    return [];
  }
}

export function createQueuedRoomStatusChange(input: {
  roomId: string;
  roomNumber: string;
  oldStatus: RoomStatusValue;
  newStatus: RoomStatusValue;
  expectedUpdatedAt: string;
  staff: StaffIdentity;
}): QueuedRoomStatusChange {
  return {
    id: makeId(),
    roomId: input.roomId,
    roomNumber: input.roomNumber,
    oldStatus: input.oldStatus,
    newStatus: input.newStatus,
    expectedUpdatedAt: input.expectedUpdatedAt,
    staff: input.staff,
    createdAt: new Date().toISOString(),
    state: "pending",
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
  };
}

/** Keeps one unresolved action per room, preserving the newest operator decision. */
export function enqueueRoomStatusChange(change: QueuedRoomStatusChange) {
  const existing = readQueuedRoomStatusChanges();
  writeQueue([...existing.filter((item) => item.roomId !== change.roomId), change]);
}

export function updateQueuedRoomStatusChange(
  id: string,
  patch: Partial<
    Pick<QueuedRoomStatusChange, "state" | "attempts" | "lastAttemptAt" | "lastError">
  >,
) {
  writeQueue(
    readQueuedRoomStatusChanges().map((change) =>
      change.id === id ? { ...change, ...patch } : change,
    ),
  );
}

export function removeQueuedRoomStatusChange(id: string) {
  writeQueue(readQueuedRoomStatusChanges().filter((change) => change.id !== id));
}

export function roomStatusQueueSummary(): RoomStatusQueueSummary {
  const changes = readQueuedRoomStatusChanges();
  return {
    pending: changes.filter((change) => change.state === "pending").length,
    conflicts: changes.filter((change) => change.state === "conflict").length,
    latest: changes.at(-1) ?? null,
  };
}

export function roomStatusChangeForRoom(roomId: string) {
  return readQueuedRoomStatusChanges().find((change) => change.roomId === roomId) ?? null;
}

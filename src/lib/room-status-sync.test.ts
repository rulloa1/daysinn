import { beforeEach, describe, expect, it } from "vitest";
import {
  createQueuedRoomStatusChange,
  enqueueRoomStatusChange,
  readQueuedRoomStatusChanges,
  ROOM_STATUS_QUEUE_KEY,
  roomStatusQueueSummary,
  updateQueuedRoomStatusChange,
} from "@/lib/room-status-sync";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  clear() {
    this.values.clear();
  }
}

const storage = new MemoryStorage();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
});

function createChange(roomId = "room-101") {
  return createQueuedRoomStatusChange({
    roomId,
    roomNumber: roomId === "room-101" ? "101" : "102",
    oldStatus: "vacant_dirty",
    newStatus: "vacant_clean",
    expectedUpdatedAt: "2026-08-26T12:00:00.000Z",
    staff: { id: "staff-1", name: "Alex" },
  });
}

describe("room-status-sync", () => {
  it("keeps only the latest unresolved action for a room", () => {
    const first = createChange();
    const replacement = createChange();

    enqueueRoomStatusChange(first);
    enqueueRoomStatusChange(replacement);

    const queue = readQueuedRoomStatusChanges();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe(replacement.id);
    expect(roomStatusQueueSummary()).toMatchObject({ pending: 1, conflicts: 0 });
  });

  it("preserves actions for separate rooms and exposes reviewable conflicts", () => {
    const first = createChange("room-101");
    const second = createChange("room-102");
    enqueueRoomStatusChange(first);
    enqueueRoomStatusChange(second);
    updateQueuedRoomStatusChange(first.id, {
      state: "conflict",
      attempts: 2,
      lastError: "A newer room update was already recorded on the live board.",
    });

    expect(readQueuedRoomStatusChanges()).toHaveLength(2);
    expect(roomStatusQueueSummary()).toMatchObject({ pending: 1, conflicts: 1 });
  });

  it("ignores malformed stored data instead of exposing it to the status workflow", () => {
    storage.setItem(ROOM_STATUS_QUEUE_KEY, "{not valid json");

    expect(readQueuedRoomStatusChanges()).toEqual([]);
    expect(roomStatusQueueSummary()).toMatchObject({ pending: 0, conflicts: 0, latest: null });
  });
});

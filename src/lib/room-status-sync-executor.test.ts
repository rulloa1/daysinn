import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQueuedRoomStatusChange,
  enqueueRoomStatusChange,
  readQueuedRoomStatusChanges,
} from "@/lib/room-status-sync";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc },
}));

import { syncQueuedRoomStatusChange } from "@/lib/room-status-sync-executor";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
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
  mocks.rpc.mockReset();
});

function createChange() {
  return createQueuedRoomStatusChange({
    roomId: "room-101",
    roomNumber: "101",
    oldStatus: "vacant_dirty",
    newStatus: "vacant_clean",
    expectedUpdatedAt: "2026-08-26T12:00:00.000Z",
    staff: { id: "staff-1", name: "Alex" },
  });
}

describe("syncQueuedRoomStatusChange", () => {
  it("records rejected RPC calls as retryable errors", async () => {
    const change = createChange();
    enqueueRoomStatusChange(change);
    mocks.rpc.mockRejectedValueOnce(new Error("Network unavailable"));

    await expect(syncQueuedRoomStatusChange(change)).resolves.toBe("error");

    expect(readQueuedRoomStatusChanges()).toMatchObject([
      {
        id: change.id,
        state: "error",
        attempts: 1,
        lastError: "Network unavailable",
      },
    ]);
  });

  it("uses a safe message when a non-Error value is thrown", async () => {
    const change = createChange();
    enqueueRoomStatusChange(change);
    mocks.rpc.mockRejectedValueOnce("offline");

    await expect(syncQueuedRoomStatusChange(change)).resolves.toBe("error");

    expect(readQueuedRoomStatusChanges()[0]?.lastError).toBe(
      "The live room-status service could not be reached.",
    );
  });
});

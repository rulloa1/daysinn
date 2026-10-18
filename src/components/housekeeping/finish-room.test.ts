import { describe, expect, it, vi } from "vitest";
import { finishRoom } from "./finish-room";
import type { RoomRow } from "./types";

const room = {
  id: "r1",
  number: "108",
  status: "vacant_dirty",
  hk_stage: "in_progress",
} as RoomRow;

describe("finishRoom", () => {
  it.each(["synced", "conflict", "queued", "error", "denied"] as const)(
    "preserves the %s outcome without issuing a second stage write",
    async (outcome) => {
      const board = { setStatus: vi.fn().mockResolvedValue(outcome), setStage: vi.fn() };
      expect(await finishRoom(board, room)).toBe(outcome);
      expect(board.setStatus).toHaveBeenCalledExactlyOnceWith(room, "vacant_clean");
      expect(board.setStage).not.toHaveBeenCalled();
    },
  );
});

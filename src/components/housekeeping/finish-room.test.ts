import { describe, expect, it, vi } from "vitest";
import { finishRoom, type FinishBoard } from "./finish-room";
import type { RoomRow } from "./types";

const room = { id: "r1", number: "108", status: "vacant_dirty" } as unknown as RoomRow;

function makeBoard(statusResult: "synced" | "conflict" | "queued" | "error") {
  const calls: string[] = [];
  const board: FinishBoard = {
    setStatus: vi.fn(async () => {
      calls.push("status");
      return statusResult;
    }),
    setStage: vi.fn(async () => {
      calls.push("stage");
      return true;
    }),
  };
  return { board, calls };
}

describe("finishRoom", () => {
  it("clears the stage only after the clean status is confirmed saved", async () => {
    const { board, calls } = makeBoard("synced");
    const result = await finishRoom(board, room);
    expect(result).toBe("synced");
    expect(board.setStatus).toHaveBeenCalledWith(room, "vacant_clean");
    expect(board.setStage).toHaveBeenCalledWith({ ...room, status: "vacant_clean" }, null);
    expect(calls).toEqual(["status", "stage"]);
  });

  it("leaves the stage alone when the status write conflicts", async () => {
    const { board } = makeBoard("conflict");
    const result = await finishRoom(board, room);
    expect(result).toBe("conflict");
    expect(board.setStage).not.toHaveBeenCalled();
  });

  it("leaves the stage alone when the status write is queued offline", async () => {
    const { board } = makeBoard("queued");
    await finishRoom(board, room);
    expect(board.setStage).not.toHaveBeenCalled();
  });

  it("leaves the stage alone when the status write errors", async () => {
    const { board } = makeBoard("error");
    await finishRoom(board, room);
    expect(board.setStage).not.toHaveBeenCalled();
  });

  it("surfaces a stage-clear failure without hiding the synced status", async () => {
    const { board } = makeBoard("synced");
    vi.mocked(board.setStage).mockRejectedValueOnce(new Error("network"));
    await expect(finishRoom(board, room)).rejects.toThrow("network");
    expect(board.setStatus).toHaveBeenCalled();
  });
});

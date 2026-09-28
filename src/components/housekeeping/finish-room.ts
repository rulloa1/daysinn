import type { RoomRow } from "./types";
import type { StatusResult } from "./use-housekeeping-board";

/** The two board writes finishing a room depends on. */
export type FinishBoard = {
  setStatus: (room: RoomRow, next: "vacant_clean") => Promise<StatusResult>;
  setStage: (room: RoomRow, stage: string | null) => Promise<boolean | void>;
};

/**
 * Finish a room: save the clean status first, and only clear the
 * in-progress stage once that save is confirmed synced. If the status
 * write conflicts, queues, or errors, the stage is left alone so the
 * room never appears finished when it isn't.
 */
export async function finishRoom(board: FinishBoard, room: RoomRow): Promise<StatusResult> {
  const result = await board.setStatus(room, "vacant_clean");
  if (result === "synced") {
    await board.setStage({ ...room, status: "vacant_clean" }, null);
  }
  return result;
}

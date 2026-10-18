import type { RoomRow } from "./types";
import type { StatusResult } from "./use-housekeeping-board";

export type FinishBoard = {
  setStatus: (room: RoomRow, next: "vacant_clean") => Promise<StatusResult>;
};

/** The status RPC clears the cleaning stage in the same audited transaction. */
export async function finishRoom(board: FinishBoard, room: RoomRow): Promise<StatusResult> {
  return board.setStatus(room, "vacant_clean");
}

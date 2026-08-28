import { describe, expect, it } from "vitest";
import {
  ASSISTANT_ROOM_STATUSES,
  DB_STATUS_CARD,
  DB_STATUS_CARD_STRONG,
  DB_STATUS_DOT,
  DB_STATUS_LABEL,
  DB_STATUS_ORDER,
  DB_STATUS_PILL,
  DB_STATUS_TEXT,
  fromAssistantRoomStatus,
  fromRoomStatus,
  type DbRoomStatus,
} from "./room-model";
import { ROOM_STATUSES } from "@/types/operations";

/**
 * The six labels Postgres accepts for `rooms.status`, transcribed from the
 * `public.room_status` enum. Writing anything else fails the whole statement,
 * so this list is the contract every writer has to satisfy.
 */
const DB_ROOM_STATUS_ENUM: DbRoomStatus[] = [
  "occupied",
  "vacant_clean",
  "vacant_dirty",
  "out_of_order",
  "occupied_dnd",
  "reserved",
];

describe("assistant status vocabulary", () => {
  it("maps every assistant status onto a real room_status enum member", () => {
    for (const status of ASSISTANT_ROOM_STATUSES) {
      const next = fromAssistantRoomStatus(status);
      // `status` is legitimately absent for stage-only transitions.
      if (next.status !== undefined) {
        expect(DB_ROOM_STATUS_ENUM, `"${status}" produced an invalid enum value`).toContain(
          next.status,
        );
      }
    }
  });

  it("moves in_progress and inspected through hk_stage, not the status column", () => {
    // in_progress must leave the stored status untouched — a room being cleaned
    // is still whatever it was before the housekeeper walked in.
    expect(fromAssistantRoomStatus("in_progress")).toEqual({ hk_stage: "in_progress" });
    expect(fromAssistantRoomStatus("inspected")).toEqual({
      status: "vacant_clean",
      hk_stage: "inspected",
    });
  });

  it("clears the transient stage for terminal statuses", () => {
    expect(fromAssistantRoomStatus("clean").hk_stage).toBeNull();
    expect(fromAssistantRoomStatus("dirty").hk_stage).toBeNull();
    expect(fromAssistantRoomStatus("out_of_order").hk_stage).toBeNull();
    expect(fromAssistantRoomStatus("occupied").hk_stage).toBeNull();
  });

  it("treats a room reported vacant as needing a clean", () => {
    // Erring towards dirty costs a wasted turnover; erring towards clean puts a
    // guest into an uncleaned room.
    expect(fromAssistantRoomStatus("vacant").status).toBe("vacant_dirty");
  });

  it("maps out_of_order to the maintenance status rather than the literal string", () => {
    expect(fromAssistantRoomStatus("out_of_order").status).toBe("out_of_order");
    expect(fromAssistantRoomStatus("clean").status).toBe("vacant_clean");
    expect(fromAssistantRoomStatus("dirty").status).toBe("vacant_dirty");
    expect(fromAssistantRoomStatus("occupied").status).toBe("occupied");
  });
});

describe("domain status write mapping", () => {
  it("never emits a status outside the database enum", () => {
    for (const status of ROOM_STATUSES) {
      const next = fromRoomStatus(status);
      if (next.status !== undefined) {
        expect(DB_ROOM_STATUS_ENUM, `"${status}" produced an invalid enum value`).toContain(
          next.status,
        );
      }
    }
  });

  it("sets the dnd flag alongside the DND status", () => {
    expect(fromRoomStatus("DND")).toEqual({ status: "occupied_dnd", hk_stage: null, dnd: true });
  });
});

describe("status presentation tokens", () => {
  it("covers every database status in every board map", () => {
    const maps = {
      DB_STATUS_LABEL,
      DB_STATUS_CARD,
      DB_STATUS_CARD_STRONG,
      DB_STATUS_DOT,
      DB_STATUS_TEXT,
      DB_STATUS_PILL,
    };
    for (const [name, map] of Object.entries(maps)) {
      expect(Object.keys(map).sort(), `${name} is missing a status`).toEqual(
        [...DB_ROOM_STATUS_ENUM].sort(),
      );
    }
  });

  it("orders every status exactly once for the board filters", () => {
    expect([...DB_STATUS_ORDER].sort()).toEqual([...DB_ROOM_STATUS_ENUM].sort());
  });
});

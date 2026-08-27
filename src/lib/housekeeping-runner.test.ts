import { describe, expect, it } from "vitest";
import {
  buildRunnerQueue,
  findNextDirtyRoomIndex,
  getRunnerMetrics,
  getRoomLandmark,
  getWalkingOrderScore,
  type RunnerRoom,
} from "./housekeeping-runner";

describe("housekeeping runner helpers", () => {
  const sampleRooms: RunnerRoom[] = [
    {
      id: "r1",
      number: "136",
      floor: 1,
      status: "vacant_dirty",
      assigned_staff_id: "staff-1",
    },
    {
      id: "r2",
      number: "101",
      floor: 1,
      status: "vacant_clean",
      assigned_staff_id: "staff-1",
    },
    {
      id: "r3",
      number: "201",
      floor: 2,
      status: "vacant_dirty",
      assigned_staff_id: "staff-2",
    },
    {
      id: "r4",
      number: "105",
      floor: 1,
      status: "occupied_dnd",
      dnd: true,
      assigned_staff_id: "staff-1",
    },
    {
      id: "r5",
      number: "102",
      floor: 1,
      status: "vacant_dirty",
      assigned_staff_id: null,
    },
  ];

  it("calculates walking order correctly", () => {
    // Floor 1 Front wing rooms should come before Floor 1 Courtyard (136)
    expect(getWalkingOrderScore("101")).toBeLessThan(getWalkingOrderScore("105"));
    expect(getWalkingOrderScore("105")).toBeLessThan(getWalkingOrderScore("136"));
    // Floor 1 should come before Floor 2
    expect(getWalkingOrderScore("136")).toBeLessThan(getWalkingOrderScore("201"));
  });

  it("builds queue with walking order sort", () => {
    const queue = buildRunnerQueue(sampleRooms, "all", "walking_order");
    const numbers = queue.map((r) => r.number);
    expect(numbers).toEqual(["101", "102", "105", "136", "201"]);
  });

  it("builds queue with priority_dirty_first sort", () => {
    const queue = buildRunnerQueue(sampleRooms, "all", "priority_dirty_first");
    // Dirty rooms (102, 136, 201) first in walking order, followed by clean/dnd (101, 105)
    const numbers = queue.map((r) => r.number);
    expect(numbers.slice(0, 3)).toEqual(["102", "136", "201"]);
    expect(numbers.slice(3)).toEqual(["101", "105"]);
  });

  it("filters by dirty only", () => {
    const queue = buildRunnerQueue(sampleRooms, "dirty_only", "walking_order");
    expect(queue.map((r) => r.number)).toEqual(["102", "136", "201"]);
  });

  it("filters by assigned staff (mine)", () => {
    const queue = buildRunnerQueue(sampleRooms, "mine", "walking_order", "staff-1");
    expect(queue.map((r) => r.number)).toEqual(["101", "105", "136"]);
  });

  it("filters by floor", () => {
    const f1 = buildRunnerQueue(sampleRooms, "floor_1", "walking_order");
    expect(f1.map((r) => r.number)).toEqual(["101", "102", "105", "136"]);

    const f2 = buildRunnerQueue(sampleRooms, "floor_2", "walking_order");
    expect(f2.map((r) => r.number)).toEqual(["201"]);
  });

  it("computes runner metrics accurately", () => {
    const metrics = getRunnerMetrics(sampleRooms);
    expect(metrics.total).toBe(5);
    expect(metrics.cleaned).toBe(1);
    expect(metrics.remainingDirty).toBe(3);
    expect(metrics.dndCount).toBe(1);
    expect(metrics.percentComplete).toBe(20);
  });

  it("finds next dirty room index correctly", () => {
    const queue = [
      { id: "1", number: "101", floor: 1, status: "vacant_clean" },
      { id: "2", number: "102", floor: 1, status: "vacant_clean" },
      { id: "3", number: "103", floor: 1, status: "vacant_dirty" },
      { id: "4", number: "104", floor: 1, status: "vacant_dirty" },
    ] as RunnerRoom[];

    // From index 0 (clean), next dirty is index 2
    expect(findNextDirtyRoomIndex(queue, 0)).toBe(2);

    // From index 2 (just cleaned), next dirty is index 3
    expect(findNextDirtyRoomIndex(queue, 2)).toBe(3);

    // From index 3, if only index 0 and 1 were dirty (wrap around test)
    const wrapQueue = [
      { id: "1", number: "101", floor: 1, status: "vacant_dirty" },
      { id: "2", number: "102", floor: 1, status: "vacant_clean" },
      { id: "3", number: "103", floor: 1, status: "vacant_clean" },
    ] as RunnerRoom[];
    expect(findNextDirtyRoomIndex(wrapQueue, 2)).toBe(0);
  });

  it("generates landmark descriptions", () => {
    const lm101 = getRoomLandmark("101");
    expect(lm101.wing).toContain("Floor 1");
    expect(lm101.landmark).toContain("Lobby");

    const lm250 = getRoomLandmark("250");
    expect(lm250.wing).toContain("Floor 2");
    expect(lm250.landmark).toContain("Courtyard");
  });
});

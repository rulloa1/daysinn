import { describe, expect, it } from "vitest";
import { isRouteEligible } from "./housekeeping-runner";

describe("isRouteEligible", () => {
  it("includes dirty and in-progress rooms", () => {
    expect(isRouteEligible({ status: "vacant_dirty" })).toBe(true);
    expect(isRouteEligible({ status: "occupied", hk_stage: "in_progress" })).toBe(true);
  });
  it("never offers DND rooms", () => {
    expect(isRouteEligible({ status: "vacant_dirty", dnd: true })).toBe(false);
    expect(isRouteEligible({ status: "occupied_dnd", hk_stage: "in_progress" })).toBe(false);
  });
  it("skips clean rooms and untouched stayovers", () => {
    expect(isRouteEligible({ status: "vacant_clean" })).toBe(false);
    expect(isRouteEligible({ status: "occupied" })).toBe(false);
  });
});

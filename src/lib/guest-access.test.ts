import { describe, expect, it } from "vitest";
import { isPastCheckout } from "./guest-access";

describe("guest checkout access", () => {
  it("allows guests with no checkout date", () => {
    expect(isPastCheckout(null, Date.parse("2026-08-25T12:00:00.000Z"))).toBe(false);
  });

  it("keeps access active through the final millisecond of checkout day", () => {
    expect(isPastCheckout("2026-08-25", Date.parse("2026-08-25T23:59:59.999Z"))).toBe(false);
    expect(isPastCheckout("2026-08-25", Date.parse("2026-08-26T00:00:00.000Z"))).toBe(true);
  });

  it("accepts ISO checkout values by normalizing them to their calendar date", () => {
    expect(isPastCheckout("2026-08-25T14:30:00.000Z", Date.parse("2026-08-25T20:00:00.000Z"))).toBe(
      false,
    );
  });

  it("fails closed when checkout data is malformed", () => {
    expect(isPastCheckout("not-a-date", Date.parse("2026-08-25T12:00:00.000Z"))).toBe(true);
    expect(isPastCheckout("2026/08/25", Date.parse("2026-08-25T12:00:00.000Z"))).toBe(true);
  });
});

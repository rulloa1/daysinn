import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidGuestSession, readGuestSession, type GuestSession } from "./guest-session";

const now = Date.parse("2026-08-25T12:00:00.000Z");

const activeSession: GuestSession = {
  room: "214",
  lastName: "Alvarez",
  guestName: "M. Alvarez",
  checkOut: "2026-08-28",
  expiresAt: "2026-08-25T13:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("guest session validation", () => {
  it("accepts complete, unexpired sessions", () => {
    expect(isValidGuestSession(activeSession, now)).toBe(true);
  });

  it("rejects expired and non-parseable expiry timestamps", () => {
    expect(
      isValidGuestSession({ ...activeSession, expiresAt: "2026-08-25T11:59:59.000Z" }, now),
    ).toBe(false);
    expect(isValidGuestSession({ ...activeSession, expiresAt: "not-a-date" }, now)).toBe(false);
  });

  it("rejects incomplete records and invalid checkout values", () => {
    expect(isValidGuestSession({ ...activeSession, guestName: "" }, now)).toBe(false);
    expect(isValidGuestSession({ ...activeSession, checkOut: 42 }, now)).toBe(false);
    expect(isValidGuestSession(null, now)).toBe(false);
  });

  it("clears corrupt browser storage rather than retaining it for future reads", () => {
    const removeItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => "{not valid JSON"),
        removeItem,
      },
    });

    expect(readGuestSession()).toBeNull();
    expect(removeItem).toHaveBeenCalledWith("daysinn.guest.session");
  });
});

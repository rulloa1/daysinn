import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

import { allowGuestAttempt } from "./audit.server";

describe("guest attempt throttling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("atomically reserves capacity for volumetric guest messages", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    const allowed = await allowGuestAttempt("guest_message", "  Room 214  ");

    expect(allowed).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("consume_guest_attempt", {
      p_scope: "guest_message",
      p_identifier: "room 214",
      p_max: 30,
      p_window_minutes: 10,
      p_failures_only: false,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("denies a volumetric action when the atomic reservation has no remaining capacity", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    await expect(allowGuestAttempt("guest_request", "214")).resolves.toBe(false);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "consume_guest_attempt",
      expect.objectContaining({ p_max: 12, p_window_minutes: 10 }),
    );
  });

  it("fails open when the atomic rate-limit operation cannot be reached", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "Database unavailable" } });

    await expect(allowGuestAttempt("guest_thread", "214")).resolves.toBe(true);
    expect(console.error).toHaveBeenCalled();
  });

  it("continues to count only failed guest sign-ins", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      then: (resolve: (value: { count: number; error: null }) => unknown) =>
        resolve({ count: 7, error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    mocks.from.mockReturnValue(query);

    await expect(allowGuestAttempt("guest_sign_in", " 214 ")).resolves.toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("succeeded", false);
  });
});

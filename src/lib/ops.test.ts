import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

import { average, formatDuration, isTurnover, logRoomStatusChange } from "./ops";

function setupAudit({ error }: { error?: { message: string } } = {}) {
  const insert = vi.fn().mockResolvedValue({ error: error ?? null });
  mocks.from.mockReturnValue({ insert });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  return { insert };
}

describe("room status operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("identifies only dirty-to-clean status changes as turnovers", () => {
    expect(isTurnover("vacant_dirty", "vacant_clean")).toBe(true);
    expect(isTurnover("occupied", "vacant_clean")).toBe(false);
    expect(isTurnover(null, "vacant_clean")).toBe(false);
  });

  it("records a complete, attributable audit event with elapsed duration", async () => {
    const { insert } = setupAudit();

    const result = await logRoomStatusChange({
      roomId: "room-214",
      roomNumber: "214",
      oldStatus: "vacant_dirty",
      newStatus: "vacant_clean",
      previousChangedAt: "2026-08-25T11:58:30.000Z",
      staff: { id: "staff-1", name: "Alex" },
    });

    expect(result).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({
      room_id: "room-214",
      room_number: "214",
      old_status: "vacant_dirty",
      new_status: "vacant_clean",
      staff_member_id: "staff-1",
      staff_name: "Alex",
      changed_by: "user-1",
      previous_changed_at: "2026-08-25T11:58:30.000Z",
      duration_seconds: 90,
      is_turnover: true,
      changed_at: "2026-08-25T12:00:00.000Z",
    });
  });

  it("records no duration when the previous timestamp is malformed", async () => {
    const { insert } = setupAudit();

    await logRoomStatusChange({
      roomId: "room-215",
      roomNumber: "215",
      oldStatus: "occupied",
      newStatus: "vacant_dirty",
      previousChangedAt: "invalid-date",
      staff: null,
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        duration_seconds: null,
        staff_member_id: null,
        staff_name: null,
        is_turnover: false,
      }),
    );
  });

  it("returns the persistence error to its caller", async () => {
    const failure = { message: "Audit write failed" };
    setupAudit({ error: failure });

    const result = await logRoomStatusChange({
      roomId: "room-216",
      roomNumber: "216",
      oldStatus: null,
      newStatus: "occupied",
      previousChangedAt: null,
      staff: null,
    });

    expect(result).toEqual({ ok: false, error: failure });
  });

  it("formats duration and aggregate values for operational summaries", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(59)).toBe("59s");
    expect(formatDuration(90)).toBe("2m");
    expect(formatDuration(3_900)).toBe("1h 5m");
    expect(average([])).toBeNull();
    expect(average([10, 12, 15])).toBe(12);
  });
});

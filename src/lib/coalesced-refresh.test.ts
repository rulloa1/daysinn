import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCoalescedRefresh, type RefreshSignal } from "./coalesced-refresh";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Resolve the microtask queue without advancing the clock. */
const flush = () => vi.advanceTimersByTimeAsync(0);

describe("createCoalescedRefresh", () => {
  it("collapses a burst of triggers into a single run", async () => {
    const run = vi.fn();
    const refresh = createCoalescedRefresh(run, 250);

    // A room status change writes to `rooms` and `room_status_events`; both
    // land within milliseconds of each other.
    refresh.schedule();
    refresh.schedule();
    refresh.schedule();
    refresh.schedule();

    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(250);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs again for a burst that arrives after the previous one settled", async () => {
    const run = vi.fn();
    const refresh = createCoalescedRefresh(run, 250);

    refresh.schedule();
    await vi.advanceTimersByTimeAsync(250);
    refresh.schedule();
    await vi.advanceTimersByTimeAsync(250);

    expect(run).toHaveBeenCalledTimes(2);
  });

  it("never runs two refreshes concurrently", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const run = vi.fn(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 100));
      inFlight -= 1;
    });
    const refresh = createCoalescedRefresh(run, 10);

    refresh.runNow();
    await flush();
    // These land while the first refresh is still awaiting its queries.
    refresh.schedule();
    await vi.advanceTimersByTimeAsync(10);
    refresh.schedule();
    await vi.advanceTimersByTimeAsync(10);

    await vi.advanceTimersByTimeAsync(500);
    expect(maxInFlight).toBe(1);
  });

  it("queues at most one follow-up for triggers during a run", async () => {
    const run = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    const refresh = createCoalescedRefresh(run, 10);

    refresh.runNow();
    await flush();
    // Five triggers during the in-flight run should produce one follow-up, not five.
    for (let i = 0; i < 5; i += 1) {
      refresh.schedule();
      await vi.advanceTimersByTimeAsync(10);
    }

    await vi.advanceTimersByTimeAsync(1000);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("runs immediately on runNow without waiting for the debounce", async () => {
    const run = vi.fn();
    const refresh = createCoalescedRefresh(run, 250);

    refresh.runNow();
    await flush();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("does not run a scheduled refresh after cancel", async () => {
    const run = vi.fn();
    const refresh = createCoalescedRefresh(run, 250);

    refresh.schedule();
    refresh.cancel();
    await vi.advanceTimersByTimeAsync(1000);

    expect(run).not.toHaveBeenCalled();
  });

  it("marks the signal cancelled so an in-flight run can discard its result", async () => {
    const seen: boolean[] = [];
    const run = vi.fn(async (signal: RefreshSignal) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      seen.push(signal.cancelled);
    });
    const refresh = createCoalescedRefresh(run, 10);

    refresh.runNow();
    await flush();
    refresh.cancel();
    await vi.advanceTimersByTimeAsync(200);

    expect(seen).toEqual([true]);
  });

  it("ignores triggers scheduled after cancel", async () => {
    const run = vi.fn();
    const refresh = createCoalescedRefresh(run, 250);

    refresh.cancel();
    refresh.schedule();
    await vi.advanceTimersByTimeAsync(1000);

    expect(run).not.toHaveBeenCalled();
  });
});

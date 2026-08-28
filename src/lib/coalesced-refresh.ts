/**
 * Passed to the refresh callback so it can drop a response that arrived after
 * the caller stopped caring (unmount, navigation) instead of writing state.
 */
export type RefreshSignal = { readonly cancelled: boolean };

export type CoalescedRefresh = {
  /** Reload after the burst settles. Repeated calls collapse into one run. */
  schedule: () => void;
  /** Reload immediately, bypassing the debounce (initial load). */
  runNow: () => void;
  /** Stop everything and mark the signal cancelled. */
  cancel: () => void;
};

/**
 * Wrap a reload function so that a burst of triggers produces one reload, and
 * only one reload is ever in flight.
 *
 * Realtime tables fire in clusters — a single room status change writes to both
 * `rooms` and `room_status_events` — and a naive one-reload-per-event
 * subscription multiplies that into several full refetches per user action on
 * every connected client.
 *
 * Triggers that arrive while a reload is running set a single follow-up rather
 * than stacking, so the caller can never have two responses racing to set the
 * same state out of order.
 */
export function createCoalescedRefresh(
  run: (signal: RefreshSignal) => void | Promise<void>,
  debounceMs = 250,
): CoalescedRefresh {
  const signal = { cancelled: false };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let queued = false;

  async function execute(): Promise<void> {
    if (signal.cancelled) return;
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      await run(signal);
    } finally {
      running = false;
    }
    if (queued && !signal.cancelled) {
      queued = false;
      void execute();
    }
  }

  return {
    schedule() {
      if (signal.cancelled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        void execute();
      }, debounceMs);
    },
    runNow() {
      void execute();
    },
    cancel() {
      signal.cancelled = true;
      if (timer) clearTimeout(timer);
      timer = undefined;
    },
  };
}

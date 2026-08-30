import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createCoalescedRefresh, type RefreshSignal } from "@/lib/coalesced-refresh";

export type { RefreshSignal };

/** The parts of a Postgres change payload a view is likely to care about. */
export type RealtimeChangeEvent = {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

export type RealtimeRefreshOptions = {
  /** Supabase channel name. Must be unique per subscribing view. */
  channel: string;
  /** Tables whose changes should trigger a refresh. */
  tables: string[];
  /** Reloads the view's data. Held in a ref, so it need not be memoised. */
  onRefresh: (signal: RefreshSignal) => void | Promise<void>;
  /**
   * Called for every individual change before the refresh is scheduled, for
   * views that react to the transition itself (an alert on a room flipping to
   * DND) rather than only to the new state.
   */
  onEvent?: (event: RealtimeChangeEvent) => void;
  /** Skip the initial load and the subscription entirely. */
  enabled?: boolean;
  /** How long to wait for a burst of table events to settle. */
  debounceMs?: number;
  /**
   * Safety-net poll interval. Used while the realtime socket is not connected
   * (locked phone, flaky hotel Wi-Fi, dropped websocket) so every device still
   * converges on the same room state.
   */
  pollMs?: number;
};

/**
 * Load once on mount, then reload once per burst of Postgres changes.
 *
 * See `createCoalescedRefresh` for why the debounce and the single-in-flight
 * guarantee matter: several of these views subscribe to four tables that a
 * single user action writes to more than once.
 */
export function useRealtimeRefresh({
  channel,
  tables,
  onRefresh,
  onEvent,
  enabled = true,
  debounceMs = 250,
  pollMs = 20000,
}: RealtimeRefreshOptions) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Depend on the contents rather than the array identity, so callers can pass
  // an inline literal without resubscribing on every render.
  const tableKey = tables.join(",");

  useEffect(() => {
    if (!enabled) return;

    const refresh = createCoalescedRefresh((signal) => onRefreshRef.current(signal), debounceMs);
    refresh.runNow();

    let subscription = supabase.channel(channel);
    for (const table of tableKey.split(",")) {
      subscription = subscription.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          onEventRef.current?.({
            table,
            eventType: payload.eventType as RealtimeChangeEvent["eventType"],
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
          });
          refresh.schedule();
        },
      );
    }
    let connected = false;
    let reconnectTimer: number | undefined;
    subscription.subscribe((status) => {
      connected = status === "SUBSCRIBED";
      if (connected) {
        refresh.schedule();
        return;
      }
      // A dropped or errored socket used to leave a device frozen on stale room
      // state until the tab was refocused. Rejoin the channel on a short delay.
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        if (reconnectTimer !== undefined) return;
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = undefined;
          void subscription.subscribe();
        }, 3000);
      }
    });

    // Poll on a timer even while the socket reports connected: a subscription can
    // stay "SUBSCRIBED" while silently missing events (proxy idling a websocket,
    // a phone waking from sleep), and every device must converge on room state.
    const timer = window.setInterval(
      () => {
        if (document.visibilityState !== "visible") return;
        // A device that is plainly offline can't reach the API; skip the request
        // and let the `online` listener pull fresh data the moment it reconnects.
        if (typeof navigator !== "undefined" && navigator.onLine === false) return;
        refresh.schedule();
      },
      connected ? pollMs * 2 : pollMs,
    );


    const onVisible = () => {
      if (document.visibilityState === "visible") refresh.schedule();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      refresh.cancel();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
      void supabase.removeChannel(subscription);
    };
  }, [channel, tableKey, enabled, debounceMs, pollMs]);
}

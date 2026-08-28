import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  enableDevicePush,
  pushPermission,
  pushSupported,
  sendDevicePush,
} from "@/lib/device-alerts";
import { subscribeWebPush, unsubscribeWebPush } from "@/lib/web-push-browser";
import { isDndActive, isExtendedStay } from "@/lib/room-model";
import type { StaffIdentity } from "@/lib/ops";
import type { RealtimeChangeEvent } from "@/hooks/use-realtime-refresh";

const ALERTS_KEY = "daysinn.housekeeping.alerts";
const PUSH_KEY = "daysinn.housekeeping.push";

/**
 * Live alerts for the housekeeping board: a toast (and optionally a device
 * push) when a room flips to Do Not Disturb or becomes an extended stay.
 *
 * Both toggles are read from and written to localStorage so a housekeeper's
 * choice survives a reload mid-shift. The current values are mirrored into refs
 * because the realtime handler is created once and would otherwise close over
 * whatever the flags were on first render.
 */
export function useHousekeepingAlerts(staff: NonNullable<StaffIdentity>) {
  const [alertsOn, setAlertsOn] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const alertsRef = useRef(false);
  const pushRef = useRef(false);

  useEffect(() => {
    setAlertsOn(localStorage.getItem(ALERTS_KEY) === "on");
    setPushOn(localStorage.getItem(PUSH_KEY) === "on" && pushPermission() === "granted");
  }, []);

  useEffect(() => {
    alertsRef.current = alertsOn;
  }, [alertsOn]);

  useEffect(() => {
    pushRef.current = pushOn;
  }, [pushOn]);

  const toggleAlerts = useCallback(() => {
    setAlertsOn((v) => {
      const next = !v;
      localStorage.setItem(ALERTS_KEY, next ? "on" : "off");
      toast[next ? "success" : "message"](next ? "Live alerts on" : "Live alerts off");
      return next;
    });
  }, []);

  const togglePush = useCallback(async () => {
    if (pushRef.current) {
      setPushOn(false);
      localStorage.setItem(PUSH_KEY, "off");
      void unsubscribeWebPush();
      toast.message("Device notifications off");
      return;
    }
    const result = await enableDevicePush();
    if (!result.ok) {
      toast.error("Can't turn on device notifications", { description: result.reason });
      return;
    }
    setPushOn(true);
    localStorage.setItem(PUSH_KEY, "on");
    // Device pushes are useless without the alerts that drive them.
    if (!alertsRef.current) {
      setAlertsOn(true);
      localStorage.setItem(ALERTS_KEY, "on");
    }

    const background = await subscribeWebPush({
      ...(staff.id ? { id: staff.id } : {}),
      ...(staff.name ? { name: staff.name } : {}),
    });
    toast.success("Device notifications on", {
      description: background.ok
        ? "Alerts arrive even when this tab is closed."
        : `Background alerts unavailable: ${background.reason}`,
    });
    sendDevicePush(
      "Days Inn housekeeping alerts on",
      "You'll be notified about DND flags and stayovers.",
      "hk-test",
    );
  }, [staff.id, staff.name]);

  /** Inspect one realtime room change and raise an alert if it matters. */
  const handleRoomEvent = useCallback((event: RealtimeChangeEvent) => {
    if (!alertsRef.current) return;
    if (event.table !== "rooms" || event.eventType !== "UPDATE") return;

    const next = event.new as {
      number?: string;
      dnd?: boolean | null;
      status?: string | null;
      extended_stay?: boolean | null;
      check_out?: string | null;
      original_check_out?: string | null;
    };
    const prev = event.old as typeof next;

    const emit = (level: "warning" | "info", title: string, description?: string) => {
      toast[level](title, description ? { description } : undefined);
      if (pushRef.current) sendDevicePush(title, description ?? "", `room-${next.number}`);
    };

    if (isDndActive(next) && !isDndActive(prev)) {
      emit(
        "warning",
        `Room ${next.number} is now Do Not Disturb`,
        "Skip this room until the flag clears.",
      );
    }

    if (isExtendedStay(next) && !isExtendedStay(prev)) {
      emit(
        "info",
        `Room ${next.number} is an extended stay`,
        next.check_out
          ? `New checkout ${next.check_out}`
          : "Service as a stayover, not a checkout.",
      );
    } else if (isExtendedStay(next) && isExtendedStay(prev) && next.check_out !== prev.check_out) {
      emit(
        "info",
        `Room ${next.number} stayover updated`,
        next.check_out ? `New checkout ${next.check_out}` : undefined,
      );
    }
  }, []);

  return {
    alertsOn,
    pushOn,
    pushSupported: pushSupported(),
    toggleAlerts,
    togglePush,
    handleRoomEvent,
  };
}

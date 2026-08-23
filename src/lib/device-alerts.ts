export type AlertLevel = "warning" | "info";

export function pushSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export async function enableDevicePush(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  if (!pushSupported()) {
    return { ok: false, reason: "This device or browser doesn't support notifications." };
  }
  if (Notification.permission === "granted") return { ok: true };
  if (Notification.permission === "denied") {
    return {
      ok: false,
      reason: "Notifications are blocked for this site in your browser settings.",
    };
  }
  const result = await Notification.requestPermission();
  return result === "granted"
    ? { ok: true }
    : { ok: false, reason: "Notification permission wasn't granted." };
}

export function sendDevicePush(title: string, body: string, tag?: string) {
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      ...(tag ? { tag } : {}),
      icon: "/favicon.png",
      badge: "/favicon.png",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Some browsers require a service worker for notifications; ignore failures.
  }
}

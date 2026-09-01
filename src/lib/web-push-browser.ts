import {
  getPushPublicKey,
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push.functions";

// A second worker at the root scope replaced the app-shell worker (and vice
// versa), so navigation and push behavior depended on which feature ran last.
const SW_PATH = "/sw.js";

export function webPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function registration() {
  return navigator.serviceWorker.register(SW_PATH, { scope: "/" });
}

/**
 * Subscribe this device for background web push.
 * Returns ok:false with a reason when the browser can't do it.
 */
export async function subscribeWebPush(staff: { id?: string; name?: string }) {
  if (!webPushSupported()) {
    return { ok: false as const, reason: "This browser can't receive background alerts." };
  }
  try {
    const { key } = await getPushPublicKey();
    if (!key) return { ok: false as const, reason: "Push isn't configured yet." };

    const reg = await registration();
    await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      }));

    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false as const, reason: "Couldn't read the push subscription." };
    }

    const saved = await savePushSubscription({
      data: {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        staffId: staff.id ?? null,
        staffName: staff.name ?? null,
      },
    });
    if (!saved.ok) return { ok: false as const, reason: "Couldn't save this device." };
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      reason: err instanceof Error ? err.message : "Push subscription failed.",
    };
  }
}

/** Unsubscribe this device and forget it server-side. */
export async function unsubscribeWebPush() {
  if (!webPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await removePushSubscription({ data: { endpoint } });
  } catch {
    // best effort
  }
}

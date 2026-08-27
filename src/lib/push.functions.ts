import { createServerFn } from "@tanstack/react-start";

/** Public VAPID key the browser needs to create a push subscription. */
export const getPushPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { key: process.env["VAPID_PUBLIC_KEY"] ?? null };
});

type SubInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  staffId?: string | null;
  staffName?: string | null;
};

/** Store (or refresh) a housekeeping device subscription. */
export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((input: SubInput) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        staff_id: data.staffId ?? null,
        staff_name: data.staffName ?? null,
        user_id: context.userId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Remove a device subscription when the housekeeper turns phone alerts off. */
export const removePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((input: { endpoint: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", data.endpoint);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

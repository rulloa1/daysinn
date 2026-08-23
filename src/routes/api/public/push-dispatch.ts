import { createFileRoute } from "@tanstack/react-router";
import { buildPushPayload } from "@block65/webcrypto-web-push";

type Body = {
  kind: "dnd" | "stayover" | "stayover_updated";
  room?: string | number | null;
  check_out?: string | null;
};

function messageFor(body: Body) {
  const room = body.room ?? "";
  switch (body.kind) {
    case "dnd":
      return {
        title: `Room ${room} is Do Not Disturb`,
        body: "Skip service for now — check back later.",
      };
    case "stayover":
      return {
        title: `Room ${room} is staying over`,
        body: "Service as a stayover, not a checkout.",
      };
    default:
      return {
        title: `Room ${room} stayover updated`,
        body: body.check_out ? `New checkout: ${body.check_out}` : "Checkout details changed.",
      };
  }
}

export const Route = createFileRoute("/api/public/push-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const presented = request.headers.get("x-push-secret") ?? "";

        // The shared secret lives in the database (rotatable without a deploy);
        // the env var stays supported as a fallback.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: secretRow } = await supabaseAdmin
          .from("internal_secrets")
          .select("value")
          .eq("name", "push_dispatch_secret")
          .maybeSingle();

        const expected = secretRow?.value ?? process.env["PUSH_DISPATCH_SECRET"] ?? "";
        if (!expected || presented.length !== expected.length || presented !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: Body;
        try {
          payload = (await request.json()) as Body;
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!payload?.kind) return new Response("Bad request", { status: 400 });

        const vapid = {
          subject: process.env["VAPID_SUBJECT"],
          publicKey: process.env["VAPID_PUBLIC_KEY"],
          privateKey: process.env["VAPID_PRIVATE_KEY"],
        };
        if (!vapid.publicKey || !vapid.privateKey || !vapid.subject) {
          return new Response("Push not configured", { status: 503 });
        }

        const { data: subs, error } = await supabaseAdmin

          .from("push_subscriptions")
          .select("endpoint, p256dh, auth");
        if (error) return new Response("Lookup failed", { status: 500 });

        const message = messageFor(payload);
        const stale: string[] = [];

        await Promise.all(
          (subs ?? []).map(async (sub) => {
            const subscription = {
              endpoint: sub.endpoint,
              expirationTime: null,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            };
            try {
              const req = await buildPushPayload(
                {
                  data: { ...message, tag: `room-${payload.room}`, url: "/housekeeping" },
                  options: { ttl: 3600, urgency: "high" },
                },
                subscription,
                vapid,
              );
              const res = await fetch(sub.endpoint, {
                method: req.method,
                headers: req.headers as unknown as HeadersInit,
                body: new Uint8Array(req.body).slice().buffer as ArrayBuffer,
              });
              if (res.status === 404 || res.status === 410) stale.push(sub.endpoint);
            } catch {
              // ignore individual delivery failures
            }
          }),
        );

        if (stale.length) {
          await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", stale);
        }

        return Response.json({ sent: (subs ?? []).length - stale.length });
      },
    },
  },
});

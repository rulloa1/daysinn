import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "@/lib/roles.guard";

/** How long a freshly issued room QR code stays scannable. */
export const QR_TTL_MINUTES = 30;
/** How long a guest stays signed in on their phone after scanning. */
export const GUEST_SESSION_HOURS = 12;

const credentialsSchema = z.object({
  room: z.string().trim().min(1).max(10),
  lastName: z.string().trim().min(1).max(80),
});

const signInSchema = credentialsSchema.extend({
  token: z.string().trim().min(10).max(120).optional(),
});

type Credentials = z.infer<typeof credentialsSchema>;

function lastNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

async function verify({ room, lastName }: Credentials) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("rooms")
    .select("number, guest_name, check_out")
    .eq("number", room)
    .maybeSingle();

  if (!data?.guest_name) return null;
  if (lastNameOf(data.guest_name) !== lastName.trim().toLowerCase()) return null;

  return {
    room: data.number,
    guestName: data.guest_name,
    checkOut: data.check_out,
  };
}

/**
 * Single-use + time-boxed: a scanned code is burned on first successful
 * sign-in, so a screenshotted or re-scanned QR cannot be replayed later.
 */
async function consumeToken(room: string, token: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();

  const { data } = await supabaseAdmin
    .from("room_qr_tokens")
    .update({ used_at: nowIso })
    .eq("token", token)
    .eq("room", room)
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", nowIso)
    .select("id")
    .maybeSingle();

  return Boolean(data);
}

export const guestSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signInSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.token && !(await consumeToken(data.room, data.token))) {
      return {
        ok: false as const,
        error:
          "That sign-in code has expired or was already used. Ask the front desk for a fresh one.",
      };
    }

    const guest = await verify(data);
    if (!guest) {
      return {
        ok: false as const,
        error: "We couldn't match that room and last name.",
      };
    }

    const expiresAt = new Date(
      Date.now() + GUEST_SESSION_HOURS * 60 * 60 * 1000,
    ).toISOString();

    return { ok: true as const, guest, expiresAt };
  });

export const guestRequests = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const guest = await verify(data);
    if (!guest) return { ok: false as const, requests: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("requests")
      .select("id, type, details, status, created_at")
      .eq("room", guest.room)
      .order("created_at", { ascending: false })
      .limit(30);

    return { ok: true as const, requests: rows ?? [] };
  });

/**
 * Staff-only: revokes every outstanding code for the room and mints a new
 * short-lived one. Rotating on demand means printed or shared codes die.
 */
export const rotateRoomQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ room: z.string().trim().min(1).max(10) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();

    await supabaseAdmin
      .from("room_qr_tokens")
      .update({ revoked_at: nowIso })
      .eq("room", data.room)
      .is("used_at", null)
      .is("revoked_at", null);

    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
    const expiresAt = new Date(
      Date.now() + QR_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    const { error } = await supabaseAdmin.from("room_qr_tokens").insert({
      room: data.room,
      token,
      expires_at: expiresAt,
      created_by: context.userId,
    });

    if (error) throw new Error("Could not issue a sign-in code.");

    return { token, expiresAt, ttlMinutes: QR_TTL_MINUTES };
  });

/** Staff-only: kills every outstanding code for a room. */
export const revokeRoomQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ room: z.string().trim().min(1).max(10) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("room_qr_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("room", data.room)
      .is("used_at", null)
      .is("revoked_at", null);

    return { ok: true as const };
  });

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { assertManager } from "./roles.guard";
import {
  completeForcedPasswordReset,
  MIN_PASSWORD_LENGTH,
  type PasswordChangeResult,
} from "./password-policy";

export { MIN_PASSWORD_LENGTH };

export type ForceResetResult = { flagged: number; emailed: number };

function callerAccessToken(): string | null {
  const header = getRequest()?.headers?.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  return token.split(".").length === 3 ? token : null;
}

/**
 * Changes the caller's password through the auth service's *user-facing*
 * endpoint, authenticated as the caller.
 *
 * Deliberately not `auth.admin.updateUserById`: going through the user endpoint
 * keeps Supabase's own password policy in play (minimum length, required
 * characters, and the breached-password check documented in docs/SECURITY.md),
 * and it requires the caller to hold a live session for the account.
 */
async function changeCallerPassword(password: string): Promise<PasswordChangeResult> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return { ok: false, message: "The auth service is not configured." };

  const token = callerAccessToken();
  if (!token) return { ok: false, message: "Sign in again to set a new password." };

  let response: Response;
  try {
    response = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
  } catch {
    return { ok: false, message: "Could not reach the auth service. Try again." };
  }

  if (response.ok) return { ok: true };

  const body = (await response.json().catch(() => null)) as {
    msg?: string;
    error_description?: string;
    message?: string;
  } | null;

  return {
    ok: false,
    message:
      body?.msg ??
      body?.error_description ??
      body?.message ??
      "The auth service rejected that password.",
  };
}

/**
 * Manager-only: require every account that holds a team role to set a new
 * password before it can work the board again, and send a reset email.
 */
export const forceStaffPasswordReset = createServerFn({ method: "POST" }).handler(
  async ({ context }): Promise<ForceResetResult> => {
    const userId = context.userId;
    if (!userId) throw new Error("Authentication required");
    await assertManager(context.supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/audit.server");

    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id");
    if (roleError) throw roleError;

    const ids = Array.from(new Set((roleRows ?? []).map((row) => row.user_id as string)));
    const stamp = new Date().toISOString();

    // Single write, so a partial failure cannot leave half the fleet ungated.
    const { error: flagError } = await supabaseAdmin.from("password_reset_requirements").upsert(
      ids.map((id) => ({
        user_id: id,
        required_at: stamp,
        required_by: userId,
        completed_at: null,
      })),
      { onConflict: "user_id" },
    );
    if (flagError) throw flagError;

    // Reset links are built from this, not from Supabase's Site URL. Without it
    // the mail falls back to Site URL, which is how these links ended up
    // pointing at localhost. Mirrors the origin used by the invite flow.
    const origin = process.env["PUBLIC_SITE_URL"] ?? "https://daysinn.lovable.app";
    const redirectTo = `${origin}/staff`;

    let emailed = 0;
    for (const id of ids) {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(id);
      const email = userRes?.user?.email;
      if (!email) continue;

      const { error: mailError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (!mailError) emailed += 1;
    }

    await recordAudit({
      entity: "auth",
      action: "password_reset_forced",
      actorUserId: userId,
      detail: { flagged: ids.length, emailed },
    });

    return { flagged: ids.length, emailed };
  },
);

/** Whether the signed-in account still owes a forced password reset. */
export const getPasswordResetStatus = createServerFn({ method: "GET" }).handler(
  async ({ context }): Promise<{ required: boolean }> => {
    if (!context.userId) return { required: false };

    const { data, error } = await context.supabase
      .from("password_reset_requirements")
      .select("user_id")
      .eq("user_id", context.userId)
      .is("completed_at", null)
      .maybeSingle();

    // Fail closed: a gate we cannot evaluate must not report "all clear".
    if (error) throw new Error("Could not check the password status for this account.");

    return { required: Boolean(data) };
  },
);

/**
 * Sets a new password and, only if the auth service accepted it, clears the
 * requirement. The requirement table is service-role-only, so this is the sole
 * path out of a forced reset.
 */
export const completePasswordReset = createServerFn({ method: "POST" })
  .validator((input) =>
    z.object({ password: z.string().min(MIN_PASSWORD_LENGTH).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Authentication required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/audit.server");

    return completeForcedPasswordReset(data.password, {
      changePassword: changeCallerPassword,
      clearRequirement: async () => {
        const { error } = await supabaseAdmin
          .from("password_reset_requirements")
          .update({ completed_at: new Date().toISOString() })
          .eq("user_id", userId)
          .is("completed_at", null);
        if (error) throw error;
      },
      recordAudit: () =>
        recordAudit({
          entity: "auth",
          action: "password_reset_completed",
          actorUserId: userId,
        }),
    });
  });

import { createServerFn } from "@tanstack/react-start";

import { assertManager } from "./roles.guard";

export const MIN_PASSWORD_LENGTH = 12;

export type ForceResetResult = { flagged: number; emailed: number };

/**
 * Manager-only: mark every account that holds a team role as needing a new
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

    // Reset links are built from this, not from Supabase's Site URL. Without it
    // the mail falls back to Site URL, which is how these links ended up
    // pointing at localhost. Mirrors the origin used by the invite flow.
    const origin = process.env["PUBLIC_SITE_URL"] ?? "https://daysinn.lovable.app";
    const redirectTo = `${origin}/staff`;

    let flagged = 0;
    let emailed = 0;
    const stamp = new Date().toISOString();

    for (const id of ids) {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(id);
      const user = userRes?.user;
      if (!user) continue;

      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          ...(user.user_metadata ?? {}),
          password_reset_required: true,
          password_reset_requested_at: stamp,
        },
      });
      if (error) continue;
      flagged += 1;

      if (user.email) {
        const { error: mailError } = await supabaseAdmin.auth.resetPasswordForEmail(user.email, {
          redirectTo,
        });
        if (!mailError) emailed += 1;
      }
    }

    await recordAudit({
      entity: "auth",
      action: "password_reset_forced",
      actorUserId: userId,
      detail: { flagged, emailed },
    });

    return { flagged, emailed };
  },
);

/** Clear the reset flag once the signed-in user has set a new password. */
export const completePasswordReset = createServerFn({ method: "POST" }).handler(
  async ({ context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Authentication required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
    const metadata = { ...(userRes?.user?.user_metadata ?? {}) } as Record<string, unknown>;
    delete metadata["password_reset_required"];
    metadata["password_reset_completed_at"] = new Date().toISOString();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });
    if (error) throw error;

    const { recordAudit } = await import("@/lib/audit.server");
    await recordAudit({
      entity: "auth",
      action: "password_reset_completed",
      actorUserId: userId,
    });

    return { ok: true };
  },
);

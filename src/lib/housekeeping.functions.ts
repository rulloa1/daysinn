import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * PIN check runs server-side so the PIN itself never reaches the browser.
 * Callers must already be signed in with a staff account.
 */
export const verifyStaffPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { memberId: string; pin: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("staff_members")
      .select("id, name, pin, active, is_supervisor, user_id")
      .eq("id", data.memberId)
      .maybeSingle();

    if (error || !row || !row.active) {
      return { ok: false as const, reason: "not_found" as const };
    }
    const success = {
      ok: true as const,
      id: row.id,
      name: row.name,
      supervisor: row.is_supervisor,
    };

    // Link this roster record to the signed-in account so row-level rules can
    // tell which rooms belong to this housekeeper.
    async function linkAccount() {
      if (row!.user_id) return;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("staff_members")
        .update({ user_id: context.userId })
        .eq("id", row!.id)
        .is("user_id", null);
    }

    // No PIN set yet: name-only sign in is allowed.
    if (!row.pin) {
      await linkAccount();
      return success;
    }
    if (row.pin !== data.pin.trim()) {
      return { ok: false as const, reason: "bad_pin" as const };
    }
    await linkAccount();
    return success;
  });

/** Store or clear a housekeeper's PIN. */
export const setStaffPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { memberId: string; pin: string }) => input)
  .handler(async ({ data, context }) => {
    const pin = data.pin.trim();
    const { error } = await context.supabase
      .from("staff_members")
      .update({ pin: pin ? pin : null })
      .eq("id", data.memberId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

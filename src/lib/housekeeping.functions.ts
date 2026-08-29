import { createServerFn } from "@tanstack/react-start";

import { assertHousekeeperOrStaff } from "./roles.guard";

/**
 * Housekeeping shift sign-on. PINs were removed: access is governed entirely by
 * the signed-in staff account's role, and the roster pick only records which
 * person on the crew is working this device.
 */
export const signInHousekeeper = createServerFn({ method: "POST" })
  .validator((input: { memberId: string }) => input)
  .handler(async ({ data, context }) => {
    // This device may not be signed in to a staff account yet. Report it as a
    // result instead of throwing, so the sign-in screen can explain it.
    try {
      await assertHousekeeperOrStaff(context.supabase, context.userId);
    } catch {
      return { ok: false as const, reason: "no_access" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("staff_members")
      .select("id, name, active, is_supervisor, user_id")
      .eq("id", data.memberId)
      .maybeSingle();

    if (error || !row || !row.active) {
      return { ok: false as const, reason: "not_found" as const };
    }

    // Link this roster record to the signed-in account so row-level rules can
    // tell which rooms belong to this housekeeper.
    if (!row.user_id) {
      await supabaseAdmin
        .from("staff_members")
        .update({ user_id: context.userId })
        .eq("id", row.id)
        .is("user_id", null);
    }

    return {
      ok: true as const,
      id: row.id,
      name: row.name,
      supervisor: row.is_supervisor,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertManager } from "./roles.guard";

export type AppRole = "manager" | "staff" | "viewer" | "housekeeper";

export type TeamMember = {
  id: string;
  email: string;
  roles: AppRole[];
};

export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamMember[]> => {
    await assertManager(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 200,
    });
    if (error) throw error;

    const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id, role");

    return users.users.map((user) => ({
      id: user.id,
      email: user.email ?? "(no email)",
      roles: ((roleRows ?? []) as { user_id: string; role: AppRole }[])
        .filter((r) => r.user_id === user.id)
        .map((r) => r.role),
    }));
  });

export const setTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: AppRole }) => {
    if (typeof input?.userId !== "string" || !input.userId) {
      throw new Error("A user is required");
    }
    if (!["manager", "staff", "viewer", "housekeeper"].includes(input.role)) {
      throw new Error("Unknown role");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId);

    if (data.userId === context.userId && data.role !== "manager") {
      throw new Error("You can't remove your own manager access");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw error;

    const { recordAudit } = await import("@/lib/audit.server");
    await recordAudit({
      entity: "user_role",
      entityId: data.userId,
      action: "granted",
      actorUserId: context.userId,
      detail: { role: data.role },
    });

    return { ok: true };
  });

export const revokeTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (typeof input?.userId !== "string" || !input.userId) {
      throw new Error("A user is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId);

    if (data.userId === context.userId) {
      throw new Error("You can't remove your own manager access");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (error) throw error;

    const { recordAudit } = await import("@/lib/audit.server");
    await recordAudit({
      entity: "user_role",
      entityId: data.userId,
      action: "revoked",
      actorUserId: context.userId,
    });

    return { ok: true };
  });

export const claimFirstManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { claimed: false };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "manager" });
    if (error) throw error;
    return { claimed: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { assertManager } from "./roles.guard";

export type AppRole = "manager" | "staff" | "viewer" | "housekeeper";

export type TeamMember = {
  id: string;
  email: string;
  roles: AppRole[];
};

export type TeamListResult =
  | { ok: true; members: TeamMember[] }
  | { ok: false; reason: "authentication_required" | "forbidden" };

export const listTeam = createServerFn({ method: "POST" }).handler(
  async ({ context }): Promise<TeamListResult> => {
    if (!context.userId) {
      return { ok: false, reason: "authentication_required" };
    }

    try {
      await assertManager(context.supabase, context.userId);
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") {
        return { ok: false, reason: "forbidden" };
      }
      throw error;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 200,
    });
    if (error) throw error;

    const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id, role");

    return {
      ok: true,
      members: users.users.map((user) => ({
        id: user.id,
        email: user.email ?? "(no email)",
        roles: ((roleRows ?? []) as { user_id: string; role: AppRole }[])
          .filter((r) => r.user_id === user.id)
          .map((r) => r.role),
      })),
    };
  },
);

export type RoleMutationResult = { ok: true } | { ok: false; message: string };

export const setTeamRole = createServerFn({ method: "POST" })
  .validator((input: { userId: string; role: AppRole }) => {
    if (typeof input?.userId !== "string" || !input.userId) {
      throw new Error("A user is required");
    }
    if (!["manager", "staff", "viewer", "housekeeper"].includes(input.role)) {
      throw new Error("Unknown role");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<RoleMutationResult> => {
    await assertManager(context.supabase, context.userId);

    if (data.userId === context.userId && data.role !== "manager") {
      return { ok: false, message: "You can't remove your own manager access" };
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
  .validator((input: { userId: string }) => {
    if (typeof input?.userId !== "string" || !input.userId) {
      throw new Error("A user is required");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<RoleMutationResult> => {
    await assertManager(context.supabase, context.userId);

    if (data.userId === context.userId) {
      return { ok: false, message: "You can't remove your own manager access" };
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

/**
 * Shape of the `claim_first_manager` migration function. The generated
 * `types.ts` won't list it until it is regenerated, so the admin client is
 * narrowed here rather than cast at the call site.
 */
type ClaimFirstManagerRpc = {
  rpc(
    fn: "claim_first_manager",
    args: { p_user_id: string },
  ): PromiseLike<{ data: boolean | null; error: { message: string } | null }>;
};

/**
 * Grants manager to the caller, but only while the roster is completely empty.
 *
 * The decision is made inside `claim_first_manager`, which holds an advisory
 * lock for the length of its transaction: a check-then-insert here could let
 * two concurrent callers both become manager.
 */
export const claimFirstManager = createServerFn({ method: "POST" }).handler(async ({ context }) => {
  const userId = context.userId;
  if (!userId) throw new Error("Authentication required");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as ClaimFirstManagerRpc;

  const { data, error } = await admin.rpc("claim_first_manager", { p_user_id: userId });
  if (error) throw new Error(error.message);

  return { claimed: data === true };
});

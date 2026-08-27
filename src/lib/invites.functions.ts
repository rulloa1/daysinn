import { createServerFn } from "@tanstack/react-start";

import { assertManager } from "./roles.guard";

export type AppRole = "manager" | "staff" | "viewer" | "housekeeper";

export type StaffInvite = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  status: string;
  sentCount: number;
  lastSentAt: string | null;
  lastSendChannel: string | null;
  expiresAt: string;
  acceptedAt: string | null;
};

type InviteRow = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  status: string;
  sent_count: number;
  last_sent_at: string | null;
  last_send_channel: string | null;
  expires_at: string;
  accepted_at: string | null;
};

function toInvite(row: InviteRow): StaffInvite {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    sentCount: row.sent_count,
    lastSentAt: row.last_sent_at,
    lastSendChannel: row.last_send_channel,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  };
}

function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string" || !value.includes("@")) {
    throw new Error("A valid email address is required");
  }
  return value.trim().toLowerCase();
}

export const listStaffInvites = createServerFn({ method: "POST" })
  
  .handler(async ({ context }): Promise<StaffInvite[]> => {
    await assertManager(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("staff_invites")
      .select(
        "id, name, email, role, status, sent_count, last_sent_at, last_send_channel, expires_at, accepted_at",
      )
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as InviteRow[]).map(toInvite);
  });

export const sendStaffInvite = createServerFn({ method: "POST" })
  
  .inputValidator((input: { name: string; email: string; role?: AppRole; inviteId?: string }) => {
    if (typeof input?.name !== "string" || !input.name.trim()) {
      throw new Error("A name is required");
    }
    const role = input.role ?? "staff";
    if (!["manager", "staff", "viewer", "housekeeper"].includes(role)) {
      throw new Error("Unknown role");
    }
    return {
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      role: role as AppRole,
      inviteId: input.inviteId ?? null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const origin = process.env["PUBLIC_SITE_URL"] ?? "https://daysinn.lovable.app";
    const redirectTo = `${origin}/staff`;

    // Find or create the auth user so the role can be granted up front.
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 200,
    });
    let userId = userList?.users.find((u) => (u.email ?? "").toLowerCase() === data.email)?.id;

    let emailSent = false;
    let emailError: string | null = null;
    let link: string | null = null;

    if (!userId) {
      const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        data.email,
        {
          redirectTo,
          data: { full_name: data.name },
        },
      );
      if (error) {
        emailError = error.message;
      } else {
        emailSent = true;
        userId = invited.user?.id;
      }
    }

    if (userId) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).neq("role", data.role);
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });
    }

    // Always produce a shareable link so invites work without email.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: userId ? "magiclink" : "invite",
      email: data.email,
      options: { redirectTo },
    });
    if (linkError) {
      if (!emailSent) emailError = emailError ?? linkError.message;
    } else {
      link = linkData?.properties?.action_link ?? null;
    }

    // Existing users get an emailed magic link instead of an invite email.
    if (!emailSent && userId) {
      const { createClient } = await import("@supabase/supabase-js");
      const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
      const publicClient = createClient(process.env["SUPABASE_URL"]!, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input: RequestInfo | URL, init?: RequestInit) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
              h.delete("Authorization");
            }
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          },
        },
      });
      const { error } = await publicClient.auth.signInWithOtp({
        email: data.email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });
      if (error) emailError = error.message;
      else emailSent = true;
    }

    const token = makeToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const existing = data.inviteId
      ? await supabaseAdmin
          .from("staff_invites")
          .select("id, sent_count")
          .eq("id", data.inviteId)
          .maybeSingle()
      : await supabaseAdmin
          .from("staff_invites")
          .select("id, sent_count")
          .eq("email", data.email)
          .maybeSingle();

    const payload = {
      name: data.name,
      email: data.email,
      role: data.role,
      token,
      status: "pending",
      last_sent_at: new Date().toISOString(),
      last_send_channel: emailSent ? "email" : "link",
      expires_at: expiresAt,
      created_by: context.userId,
    };

    let inviteId = existing?.data?.id as string | undefined;
    if (inviteId) {
      const { error } = await supabaseAdmin
        .from("staff_invites")
        .update({
          ...payload,
          sent_count: (existing?.data?.sent_count ?? 0) + 1,
        })
        .eq("id", inviteId);
      if (error) throw error;
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("staff_invites")
        .insert({ ...payload, sent_count: 1 })
        .select("id")
        .single();
      if (error) throw error;
      inviteId = inserted.id as string;
    }

    return { inviteId, emailSent, emailError, link };
  });

export const revokeStaffInvite = createServerFn({ method: "POST" })
  
  .inputValidator((input: { inviteId: string }) => {
    if (typeof input?.inviteId !== "string" || !input.inviteId) {
      throw new Error("An invite is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("staff_invites")
      .update({ status: "revoked" })
      .eq("id", data.inviteId);
    if (error) throw error;
    return { ok: true };
  });

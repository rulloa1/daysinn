import type { SupabaseClient } from "@supabase/supabase-js";

import { PasswordResetRequiredError } from "./password-policy";

/**
 * Refuses the call while the account still owes a forced password reset.
 *
 * This lives in the guards rather than in the UI on purpose: `PasswordResetGate`
 * is a React component, so a flagged account could previously skip it by calling
 * server functions directly. Every guarded server function now goes through here.
 */
export async function assertPasswordResetComplete(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("password_reset_requirements")
    .select("user_id")
    .eq("user_id", userId)
    .is("completed_at", null)
    .maybeSingle();

  // Fail closed. A security gate that cannot be evaluated must not open.
  if (error) throw new Error("Could not verify the password status for this account");
  if (data) throw new PasswordResetRequiredError();
}

export async function assertManager(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<void> {
  if (!userId) throw new Error("Authentication required");
  await assertPasswordResetComplete(supabase, userId);

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "manager")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export async function assertStaff(supabase: SupabaseClient, userId: string | null): Promise<void> {
  if (!userId) throw new Error("Authentication required");
  await assertPasswordResetComplete(supabase, userId);

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["staff", "manager"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

export async function assertFrontDesk(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<void> {
  return assertStaff(supabase, userId);
}

export async function assertHousekeeperOrStaff(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<void> {
  if (!userId) throw new Error("Authentication required");
  await assertPasswordResetComplete(supabase, userId);

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["housekeeper", "staff", "manager"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

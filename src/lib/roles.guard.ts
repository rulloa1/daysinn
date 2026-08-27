import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertManager(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<void> {
  if (!userId) throw new Error("Authentication required");

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

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["housekeeper", "staff", "manager"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

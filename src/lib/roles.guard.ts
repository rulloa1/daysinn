export async function assertManager(
  supabase: any,
  userId: string,
): Promise<void> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "manager")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export async function assertStaff(
  supabase: any,
  userId: string,
): Promise<void> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["staff", "manager"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

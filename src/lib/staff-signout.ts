import { supabase } from "@/integrations/supabase/client";

const IDENTITY_KEYS = ["daysinn.staff.identity", "daysinn.housekeeping.identity"] as const;

/**
 * End the Supabase session and forget the remembered "who is on the desk"
 * name, so the next sign-in starts at the staff name picker again.
 */
export async function signOutStaff(): Promise<void> {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") {
    for (const key of IDENTITY_KEYS) window.localStorage.removeItem(key);
  }
}
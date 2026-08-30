import { supabase } from "@/integrations/supabase/client";

/**
 * Removes auth sessions left behind by an older backend. A phone that installed
 * the PWA before the backend switch can still hold a token the current project
 * rejects: `getSession()` succeeds locally, but every role/roster read comes
 * back empty, which the UI used to show as "restricted access".
 */
export function clearStaleAuthStorage(activeStorageKey?: string) {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (/^sb-.*-auth-token/.test(key) && key !== activeStorageKey) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* storage may be unavailable; nothing to clean */
  }
}

/**
 * Confirms the stored session is accepted by the live backend. Unlike
 * `getSession()` (a local read), this validates the token server-side.
 */
export async function verifyLiveSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getUser();
    return Boolean(data.user) && !error;
  } catch {
    return false;
  }
}

/** Signs the device out completely so the next sign-in starts clean. */
export async function resetStaffSession() {
  try {
    await supabase.auth.signOut();
  } catch {
    /* already signed out */
  }
  clearStaleAuthStorage();
}

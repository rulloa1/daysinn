import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { readPresentationMode } from "@/lib/presentation";

export type AppRole = "manager" | "staff" | "viewer" | "housekeeper";

export function useStaffRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const isDemo = !isSupabaseConfigured || readPresentationMode();
    if (isDemo) {
      setRoles(["manager"]);
      setLoading(false);
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        setRoles([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
    } catch (err) {
      console.error("[useStaffRole] Failed to fetch staff role:", err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isManager = roles.includes("manager");
  const isHousekeeper = roles.includes("housekeeper");
  const canTriage = isManager || roles.includes("staff") || isHousekeeper;

  return { roles, loading, isManager, isHousekeeper, canTriage, refresh };
}

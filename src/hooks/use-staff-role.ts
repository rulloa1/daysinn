import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export type AppRole = "manager" | "staff" | "viewer" | "housekeeper";

export function useStaffRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setRoles([]);
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
  const isStaff = roles.includes("staff");
  const isHousekeeper = roles.includes("housekeeper");
  const isFrontDesk = isManager || isStaff;
  const canTriage = isManager || isStaff || isHousekeeper;
  const canClean = isManager || isStaff || isHousekeeper;

  return {
    roles,
    loading,
    isManager,
    isStaff,
    isHousekeeper,
    isFrontDesk,
    canTriage,
    canClean,
    refresh,
  };
}

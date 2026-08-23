import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "manager" | "staff" | "viewer";

export function useStaffRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setRoles([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isManager = roles.includes("manager");
  const canTriage = isManager || roles.includes("staff");

  return { roles, loading, isManager, canTriage, refresh };
}

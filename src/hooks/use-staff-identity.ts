import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StaffIdentity, StaffMember } from "@/lib/ops";

type IdentityOptions = {
  /** Filter the roster to one department, e.g. "housekeeping". */
  department?: string;
  /** Separate the remembered selection per surface. */
  storageKey?: string;
};

function read(STORAGE_KEY: string): StaffIdentity {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StaffIdentity) : null;
  } catch {
    return null;
  }
}

/**
 * Lightweight "who is on the desk" identity. Names live in the shared
 * staff_members table; the current selection is remembered per device.
 * Full per-person auth can replace this without touching the log schema.
 */
export function useStaffIdentity(options: IdentityOptions = {}) {
  const department = options.department;
  const STORAGE_KEY = options.storageKey ?? "daysinn.staff.identity";
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [staff, setStaff] = useState<StaffIdentity>(null);

  useEffect(() => {
    setStaff(read(STORAGE_KEY));
  }, [STORAGE_KEY]);

  const refresh = useCallback(async () => {
    let query = supabase
      .from("staff_members")
      .select("id, name, active, department")
      .eq("active", true);
    if (department) query = query.eq("department", department);
    const { data } = await query.order("name");
    setMembers((data ?? []) as StaffMember[]);
  }, [department]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const select = useCallback((next: StaffIdentity) => {
    setStaff(next);
    if (typeof window === "undefined") return;
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [STORAGE_KEY]);

  const addMember = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const { data, error } = await supabase
        .from("staff_members")
        .insert({ name: trimmed, department: department ?? "front_desk" })
        .select("id, name, active, department")
        .single();
      if (error || !data) return null;
      await refresh();
      select({ id: data.id, name: data.name });
      return data as StaffMember;
    },
    [refresh, select, department],
  );

  return { members, staff, select, addMember, refresh };
}

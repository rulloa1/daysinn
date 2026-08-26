import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { readPresentationMode } from "@/lib/presentation";
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
    const isDemo = !isSupabaseConfigured || readPresentationMode();
    if (isDemo) {
      const mockMembers: StaffMember[] = [
        { id: "demo-presenter", name: "Presenter", active: true, department: "front_desk" },
        {
          id: "demo-alice",
          name: "Alice Smith (Housekeeper)",
          active: true,
          department: "housekeeping",
        },
        { id: "demo-bob", name: "Bob Jones (Front Desk)", active: true, department: "front_desk" },
        {
          id: "demo-charlie",
          name: "Charlie Brown (Housekeeper)",
          active: true,
          department: "housekeeping",
        },
      ];
      if (department) {
        setMembers(mockMembers.filter((m) => m.department === department));
      } else {
        setMembers(mockMembers);
      }
      return;
    }

    try {
      if (department === "housekeeping") {
        // Housekeeping roster: always show housekeeping staff, and also include
        // front-desk staff who are currently assigned to rooms.
        const [{ data: hk }, { data: assignedRooms }] = await Promise.all([
          supabase
            .from("staff_members")
            .select("id, name, active, department")
            .eq("active", true)
            .eq("department", "housekeeping")
            .order("name"),
          supabase.from("rooms").select("assigned_staff_id").not("assigned_staff_id", "is", null),
        ]);

        const assignedIds = [
          ...new Set(
            (assignedRooms ?? [])
              .map((r) => r.assigned_staff_id)
              .filter((id): id is string => !!id),
          ),
        ];

        let frontDesk: StaffMember[] = [];
        if (assignedIds.length > 0) {
          const { data } = await supabase
            .from("staff_members")
            .select("id, name, active, department")
            .eq("active", true)
            .eq("department", "front_desk")
            .in("id", assignedIds)
            .order("name");
          frontDesk = (data ?? []) as StaffMember[];
        }

        const byId = new Map<string, StaffMember>();
        for (const m of (hk ?? []) as StaffMember[]) byId.set(m.id, m);
        for (const m of frontDesk) byId.set(m.id, m);
        setMembers([...byId.values()]);
        return;
      }

      let query = supabase
        .from("staff_members")
        .select("id, name, active, department")
        .eq("active", true);
      if (department) query = query.eq("department", department);
      const { data } = await query.order("name");
      setMembers((data ?? []) as StaffMember[]);
    } catch (err) {
      console.error("[useStaffIdentity] Failed to refresh staff roster:", err);
      setMembers([]);
    }
  }, [department]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const select = useCallback(
    (next: StaffIdentity) => {
      setStaff(next);
      if (typeof window === "undefined") return;
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    },
    [STORAGE_KEY],
  );

  const addMember = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const isDemo = !isSupabaseConfigured || readPresentationMode();
      if (isDemo) {
        const newMember: StaffMember = {
          id: `demo-${Date.now()}`,
          name: trimmed,
          active: true,
          department: department ?? "front_desk",
        };
        setMembers((prev) => [...prev, newMember]);
        select({ id: newMember.id, name: newMember.name });
        return newMember;
      }

      try {
        const { data, error } = await supabase
          .from("staff_members")
          .insert({ name: trimmed, department: department ?? "front_desk" })
          .select("id, name, active, department")
          .single();
        if (error || !data) return null;
        await refresh();
        select({ id: data.id, name: data.name });
        return data as StaffMember;
      } catch (err) {
        console.error("[useStaffIdentity] Failed to add staff member:", err);
        return null;
      }
    },
    [refresh, select, department],
  );

  return { members, staff, select, addMember, refresh };
}

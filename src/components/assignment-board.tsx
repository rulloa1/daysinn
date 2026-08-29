import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Housekeeper = { id: string; name: string };

type Room = {
  id: string;
  number: string;
  floor: number;
  status: string;
  assigned_staff_id: string | null;
  assigned_name: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  vacant_dirty: "Dirty",
  vacant_clean: "Clean",
  occupied: "Occupied",
  occupied_dnd: "DND",
  reserved: "Reserved",
  out_of_order: "OOO",
};

/**
 * Manager tool: assign specific rooms to housekeepers for the shift.
 * Writes to rooms.assigned_staff_id / assigned_name / assigned_at, the same
 * fields the /housekeeping board reads for its "My rooms" filter.
 */
export function AssignmentBoard() {
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<string>("");
  const [onlyDirty, setOnlyDirty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [staffRes, roomRes] = await Promise.all([
      supabase
        .from("staff_members")
        .select("id, name")
        .eq("active", true)
        .eq("department", "housekeeping")
        .order("name"),
      supabase
        .from("rooms")
        .select("id, number, floor, status, assigned_staff_id, assigned_name")
        .order("number"),
    ]);
    if (staffRes.data) {
      setHousekeepers(staffRes.data as Housekeeper[]);
      setTarget((prev) => prev || (staffRes.data[0]?.id ?? ""));
    }
    if (roomRes.data) setRooms(roomRes.data as Room[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => rooms.filter((r) => (onlyDirty ? r.status === "vacant_dirty" : true)),
    [rooms, onlyDirty],
  );

  const byHousekeeper = useMemo(() => {
    const map = new Map<string, number>();
    for (const room of rooms) {
      if (!room.assigned_staff_id) continue;
      map.set(room.assigned_staff_id, (map.get(room.assigned_staff_id) ?? 0) + 1);
    }
    return map;
  }, [rooms]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function apply(ids: string[], staff: Housekeeper | null) {
    if (ids.length === 0) {
      toast.error("Pick at least one room first.");
      return;
    }
    setBusy(true);
    const patch = staff
      ? {
          assigned_staff_id: staff.id,
          assigned_name: staff.name,
          assigned_at: new Date().toISOString(),
        }
      : { assigned_staff_id: null, assigned_name: null, assigned_at: null };
    const { error } = await supabase.from("rooms").update(patch).in("id", ids);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save the assignment.");
      return;
    }
    setRooms((prev) =>
      prev.map((r) =>
        ids.includes(r.id)
          ? {
              ...r,
              assigned_staff_id: patch.assigned_staff_id,
              assigned_name: patch.assigned_name,
            }
          : r,
      ),
    );
    setSelected(new Set());
    toast.success(
      staff ? `${ids.length} room(s) assigned to ${staff.name}.` : `${ids.length} room(s) cleared.`,
    );
  }

  async function autoSplit() {
    if (housekeepers.length === 0) return;
    const pool = visible.filter((r) => !r.assigned_staff_id);
    if (pool.length === 0) {
      toast.error("No unassigned rooms to split.");
      return;
    }
    setBusy(true);
    let index = 0;
    for (const person of housekeepers) {
      const share = pool.filter((_, i) => i % housekeepers.length === index).map((r) => r.id);
      index += 1;
      if (share.length === 0) continue;
      const { error } = await supabase
        .from("rooms")
        .update({
          assigned_staff_id: person.id,
          assigned_name: person.name,
          assigned_at: new Date().toISOString(),
        })
        .in("id", share);
      if (error) {
        setBusy(false);
        toast.error("Couldn't finish the auto-split.");
        await load();
        return;
      }
    }
    setBusy(false);
    setSelected(new Set());
    await load();
    toast.success(`${pool.length} room(s) split across ${housekeepers.length} housekeeper(s).`);
  }

  const targetStaff = housekeepers.find((h) => h.id === target) ?? null;

  return (
    <section>
      <p className="signage flex items-center gap-2 text-brand-gold">
        <span aria-hidden className="h-3 w-[3px] bg-brand-gold" />
        Housekeeping
      </p>
      <h2 className="mt-3 font-serif text-2xl font-bold text-brand-blue">Room assignments</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Assign specific rooms to a housekeeper for their shift. Assigned rooms show up under “My
        rooms” on the housekeeping board.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          className="h-10 min-w-[12rem] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
        >
          {housekeepers.length === 0 ? <option value="">No housekeepers yet</option> : null}
          {housekeepers.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name} · {byHousekeeper.get(person.id) ?? 0} room(s)
            </option>
          ))}
        </select>
        <Button
          disabled={busy || !targetStaff}
          onClick={() => void apply([...selected], targetStaff)}
          className="bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
        >
          Assign {selected.size > 0 ? `${selected.size} ` : ""}selected
        </Button>
        <Button
          variant="outline"
          disabled={busy || selected.size === 0}
          onClick={() => void apply([...selected], null)}
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          Clear selected
        </Button>
        <Button
          variant="outline"
          disabled={busy || housekeepers.length === 0}
          onClick={() => void autoSplit()}
          className="border-brand-gold bg-white font-semibold text-brand-blue hover:bg-brand-gold/10"
        >
          Auto-split unassigned
        </Button>
        <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={onlyDirty}
            onChange={(event) => setOnlyDirty(event.target.checked)}
            className="h-4 w-4 accent-[#004986]"
          />
          Only rooms needing service
        </label>
      </div>

      {!loaded ? (
        <p className="mt-6 text-sm text-slate-500">Loading rooms…</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No rooms match this filter right now.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {visible.map((room) => {
            const isSelected = selected.has(room.id);
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => toggle(room.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-brand-blue bg-[#E7EDF5] shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <span className="font-mono text-lg font-bold text-brand-blue">{room.number}</span>
                <span className="mt-1 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {STATUS_LABEL[room.status] ?? room.status}
                </span>
                <Badge
                  className={`mt-2 text-[11px] ${
                    room.assigned_name
                      ? "bg-[#E7EDF5] text-[#004986]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {room.assigned_name ?? "Unassigned"}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

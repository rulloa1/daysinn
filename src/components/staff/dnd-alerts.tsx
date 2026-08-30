import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import type { QueueRoom } from "./use-request-queue";

/** Who acknowledged a room's current DND, and when. */
type Ack = { name: string | null; at: string };

/** A room counts as DND when the guest flag is up or the status says so. */
function isDnd(room: QueueRoom) {
  return Boolean(room.dnd) || room.status === "occupied_dnd";
}

function sinceLabel(iso: string | null) {
  if (!iso) return "time unknown";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "time unknown";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  const clock = new Date(then).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (mins < 1) return `just now (${clock})`;
  if (mins < 60) return `${mins} min ago (${clock})`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago (${clock})`;
}

/**
 * Front-desk banner for rooms that just went Do Not Disturb. Times come from
 * the room status event log so the alert shows when DND was actually set,
 * not when the row was last touched. Acknowledgements are recorded in the
 * database, so the banner stays cleared for every device until DND is re-set.
 */
export function DndAlerts({ rooms }: { rooms: QueueRoom[] }) {
  const { staff } = useStaffIdentity();
  const dndRooms = useMemo(() => rooms.filter(isDnd), [rooms]);
  const key = useMemo(() => dndRooms.map((r) => r.number).sort().join(","), [dndRooms]);
  const [setAt, setSetAt] = useState<Record<string, string>>({});
  const [acks, setAcks] = useState<Record<string, Ack>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    // Re-render every minute so the "x min ago" copy stays honest.
    const id = window.setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const numbers = key ? key.split(",") : [];
    if (numbers.length === 0) {
      setSetAt({});
      setAcks({});
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("room_status_events")
        .select("room_number, new_status, changed_at")
        .in("room_number", numbers)
        .eq("new_status", "occupied_dnd")
        .order("changed_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      const latest: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.room_number && !latest[row.room_number]) latest[row.room_number] = row.changed_at;
      }
      setSetAt(latest);
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Load acknowledgements for the rooms currently on DND.
  useEffect(() => {
    let cancelled = false;
    const numbers = key ? key.split(",") : [];
    if (numbers.length === 0) return;
    void (async () => {
      const { data } = await supabase
        .from("dnd_acknowledgements")
        .select("room, dnd_set_at, acknowledged_by_name, acknowledged_at")
        .in("room", numbers)
        .order("acknowledged_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      const latest: Record<string, Ack & { forSetAt: string | null }> = {};
      for (const row of data ?? []) {
        if (!latest[row.room]) {
          latest[row.room] = {
            name: row.acknowledged_by_name,
            at: row.acknowledged_at,
            forSetAt: row.dnd_set_at,
          };
        }
      }
      setAcks(
        Object.fromEntries(
          Object.entries(latest)
            // An acknowledgement only clears the DND period it was made for.
            .filter(([room, v]) => (setAt[room] ?? null) === v.forSetAt)
            .map(([room, v]) => [room, { name: v.name, at: v.at }]),
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [key, setAt]);

  const acknowledge = useCallback(
    async (room: string) => {
      setSaving(room);
      const name = staff?.name ?? "Front desk";
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("dnd_acknowledgements").insert({
        room,
        dnd_set_at: setAt[room] ?? null,
        acknowledged_by_name: name,
        acknowledged_by_staff_id: staff?.id ?? null,
        acknowledged_by_user_id: auth.user?.id ?? null,
      });
      setSaving(null);
      if (error) {
        toast.error("Couldn't record the acknowledgement.");
        return;
      }
      setAcks((prev) => ({ ...prev, [room]: { name, at: new Date().toISOString() } }));
      toast.success(`Room ${room} DND acknowledged by ${name}.`);
    },
    [staff, setAt],
  );

  const active = dndRooms.filter((r) => !acks[r.number]);
  if (active.length === 0) return null;

  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border-2 border-rose-400/60 bg-rose-50 p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-rose-700" aria-hidden />
        <p className="text-[11px] font-bold tracking-widest text-rose-700 uppercase">
          Do Not Disturb · {active.length} {active.length === 1 ? "room" : "rooms"}
        </p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {active.map((room) => (
          <li
            key={room.number}
            className="flex items-center gap-3 rounded-xl border border-rose-300 bg-white px-3 py-2"
          >
            <span className="text-lg font-black text-rose-800">{room.number}</span>
            <span className="text-xs text-slate-600">
              DND set {sinceLabel(setAt[room.number] ?? room.updated_at ?? null)}
            </span>
            <button
              type="button"
              disabled={saving === room.number}
              onClick={() => void acknowledge(room.number)}
              aria-label={`Acknowledge Do Not Disturb alert for room ${room.number}`}
              className="ml-1 inline-flex min-h-9 items-center gap-1 rounded-lg border border-rose-300 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              <Check className="h-4 w-4" aria-hidden />
              {saving === room.number ? "Saving…" : "Acknowledge"}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-600">
        Hold housekeeping and deliveries for these rooms until the guest clears DND.
      </p>
    </section>
  );
}

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Shift = {
  id: string;
  staff_member_id: string;
  staff_name: string;
  clock_in_at: string;
  clock_out_at: string | null;
  duration_seconds: number | null;
};

function elapsed(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function stampTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function stampDay(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Clock-in / clock-out card with a short shift history for one staff member.
 * Rows live in `staff_shifts`; the database fills in duration on clock-out.
 */
export function ShiftClock({
  staff,
  disabled,
}: {
  staff: { id: string; name: string };
  disabled?: boolean;
}) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("staff_shifts")
      .select("id, staff_member_id, staff_name, clock_in_at, clock_out_at, duration_seconds")
      .eq("staff_member_id", staff.id)
      .order("clock_in_at", { ascending: false })
      .limit(8);
    if (!error) setShifts((data ?? []) as Shift[]);
    setLoaded(true);
  }, [staff.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const open = shifts.find((s) => !s.clock_out_at) ?? null;

  async function clockIn() {
    setBusy(true);
    const { error } = await supabase.from("staff_shifts").insert({
      staff_member_id: staff.id,
      staff_name: staff.name,
      department: "housekeeping",
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't clock in — ask a manager to check your access.");
      return;
    }
    toast.success(`Clocked in · ${staff.name}`);
    await load();
  }

  async function clockOut() {
    if (!open) return;
    setBusy(true);
    const { error } = await supabase
      .from("staff_shifts")
      .update({ clock_out_at: new Date().toISOString() })
      .eq("id", open.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't clock out.");
      return;
    }
    toast.success("Clocked out — shift logged.");
    await load();
  }

  const runningSeconds = open ? (now - new Date(open.clock_in_at).getTime()) / 1000 : 0;

  return (
    <section className="mt-3 border border-cream/15 bg-cream/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="signage text-cream/50">Time clock</p>
          <p className="mt-1 text-sm text-cream/75">
            {open ? (
              <>
                On shift since {stampTime(open.clock_in_at)} ·{" "}
                <span className="text-amber">{elapsed(runningSeconds)}</span>
              </>
            ) : loaded ? (
              "Not clocked in."
            ) : (
              "Loading…"
            )}
          </p>
        </div>
        {open ? (
          <Button
            onClick={() => void clockOut()}
            disabled={busy || disabled}
            className="h-11 border border-cream/25 bg-transparent text-cream hover:bg-cream/10"
          >
            {busy ? "Saving…" : "Clock out"}
          </Button>
        ) : (
          <Button
            onClick={() => void clockIn()}
            disabled={busy || disabled}
            className="h-11 bg-amber text-ink hover:bg-amber/90"
          >
            {busy ? "Saving…" : "Clock in"}
          </Button>
        )}
      </div>

      {shifts.length > 0 && (
        <ul className="mt-4 divide-y divide-cream/10 border-t border-cream/10">
          {shifts.map((shift) => (
            <li
              key={shift.id}
              className="flex items-center justify-between gap-3 py-2 text-xs text-cream/60"
            >
              <span>
                {stampDay(shift.clock_in_at)} · {stampTime(shift.clock_in_at)} –{" "}
                {shift.clock_out_at ? stampTime(shift.clock_out_at) : "open"}
              </span>
              <span className={shift.clock_out_at ? "text-cream/75" : "text-amber"}>
                {shift.duration_seconds != null
                  ? elapsed(shift.duration_seconds)
                  : elapsed(runningSeconds)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

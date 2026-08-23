import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Shift = {
  id: string;
  staff_name: string;
  work_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
};

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeLabel(value: string) {
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Upcoming shifts for the signed-in employee. Supervisors see the whole
 * team's week; everyone else only gets their own rows (enforced in the
 * database as well as here).
 */
export function MySchedule({
  staff,
  supervisor,
}: {
  staff: { id: string; name: string };
  supervisor: boolean;
}) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      let query = supabase
        .from("staff_schedules")
        .select("id, staff_name, work_date, start_time, end_time, notes")
        .gte("work_date", today)
        .order("work_date")
        .order("start_time")
        .limit(supervisor ? 40 : 10);
      if (!supervisor) query = query.eq("staff_member_id", staff.id);
      const { data } = await query;
      if (!active) return;
      setShifts((data ?? []) as Shift[]);
      setLoaded(true);
    }
    void load();
    return () => {
      active = false;
    };
  }, [staff.id, supervisor]);

  return (
    <section className="mt-8 border border-cream/15 bg-cream/[0.04] p-5">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        {supervisor ? "Team schedule" : "My schedule"}
      </p>
      {!loaded ? (
        <p className="mt-3 text-sm text-cream/55">Loading shifts…</p>
      ) : shifts.length === 0 ? (
        <p className="mt-3 text-sm text-cream/55">
          No upcoming shifts posted. A supervisor sets these from the staff portal.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-cream/10">
          {shifts.map((shift) => (
            <li key={shift.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <p className="text-sm">
                  {dayLabel(shift.work_date)}
                  {supervisor ? ` · ${shift.staff_name}` : ""}
                </p>
                {shift.notes ? (
                  <p className="text-[11px] text-cream/50">{shift.notes}</p>
                ) : null}
              </div>
              <p className="text-sm text-cream/70">
                {timeLabel(shift.start_time)} – {timeLabel(shift.end_time)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

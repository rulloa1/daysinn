import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Member = {
  id: string;
  name: string;
  department: string;
  is_supervisor: boolean;
};

type Shift = {
  id: string;
  staff_member_id: string;
  staff_name: string;
  department: string;
  work_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
};

type Room = {
  id: string;
  number: string;
  floor: number;
  status: string;
};

type ShiftRoom = {
  id: string;
  schedule_id: string;
  staff_member_id: string;
  staff_name: string;
  work_date: string;
  room_id: string | null;
  room_number: string;
};


function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function dayLabel(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function timeLabel(value: string) {
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Supervisor tool: build the weekly employee schedule and flag who is a
 * housekeeping supervisor. Supervisors see the whole board; regular
 * housekeepers only see rooms assigned to them.
 */
export function ScheduleBoard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shiftRooms, setShiftRooms] = useState<ShiftRoom[]>([]);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const [onlyDirty, setOnlyDirty] = useState(false);
  const [weekStart, setWeekStart] = useState(() => isoDate(0));
  const [memberId, setMemberId] = useState("");
  const [date, setDate] = useState(() => isoDate(0));
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("16:00");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(`${weekStart}T12:00:00`);
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      }),
    [weekStart],
  );

  const load = useCallback(async () => {
    const [staffRes, shiftRes, roomRes, assignRes] = await Promise.all([
      supabase
        .from("staff_members")
        .select("id, name, department, is_supervisor")
        .eq("active", true)
        .order("name"),
      supabase
        .from("staff_schedules")
        .select("id, staff_member_id, staff_name, department, work_date, start_time, end_time, notes")
        .gte("work_date", days[0]!)
        .lte("work_date", days[6]!)
        .order("work_date")
        .order("start_time"),
      supabase.from("rooms").select("id, number, floor, status").order("number"),
      supabase
        .from("shift_room_assignments")
        .select("id, schedule_id, staff_member_id, staff_name, work_date, room_id, room_number")
        .gte("work_date", days[0]!)
        .lte("work_date", days[6]!)
        .order("room_number"),
    ]);
    if (staffRes.data) {
      setMembers(staffRes.data as Member[]);
      setMemberId((prev) => prev || (staffRes.data[0]?.id ?? ""));
    }
    if (shiftRes.data) setShifts(shiftRes.data as Shift[]);
    if (roomRes.data) setRooms(roomRes.data as Room[]);
    if (assignRes.data) setShiftRooms(assignRes.data as ShiftRoom[]);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeShift = shifts.find((s) => s.id === activeShiftId) ?? null;
  const activeRooms = shiftRooms.filter((r) => r.schedule_id === activeShiftId);
  const activeRoomNumbers = new Set(activeRooms.map((r) => r.room_number));

  async function toggleRoom(room: Room) {
    if (!activeShift) return;
    const existing = activeRooms.find((r) => r.room_number === room.number);
    if (existing) {
      const { error } = await supabase.from("shift_room_assignments").delete().eq("id", existing.id);
      if (error) {
        toast.error("Couldn't remove that room.");
        return;
      }
      setShiftRooms((prev) => prev.filter((r) => r.id !== existing.id));
      return;
    }
    const { data, error } = await supabase
      .from("shift_room_assignments")
      .insert({
        schedule_id: activeShift.id,
        staff_member_id: activeShift.staff_member_id,
        staff_name: activeShift.staff_name,
        work_date: activeShift.work_date,
        room_id: room.id,
        room_number: room.number,
      })
      .select("id, schedule_id, staff_member_id, staff_name, work_date, room_id, room_number")
      .single();
    if (error || !data) {
      toast.error("Couldn't assign that room.");
      return;
    }
    setShiftRooms((prev) => [...prev, data as ShiftRoom]);
  }

  /** Push a shift's room list onto the live housekeeping board. */
  async function pushToBoard() {
    if (!activeShift || activeRooms.length === 0) {
      toast.error("Assign at least one room to this shift first.");
      return;
    }
    setBusy(true);
    const ids = activeRooms.map((r) => r.room_id).filter((id): id is string => Boolean(id));
    const { error } = await supabase
      .from("rooms")
      .update({
        assigned_staff_id: activeShift.staff_member_id,
        assigned_name: activeShift.staff_name,
        assigned_at: new Date().toISOString(),
      })
      .in("id", ids);
    setBusy(false);
    if (error) {
      toast.error("Couldn't push the assignment to the board.");
      return;
    }
    toast.success(`${ids.length} room(s) sent to ${activeShift.staff_name}'s board.`);
  }


  async function addShift() {
    const person = members.find((m) => m.id === memberId);
    if (!person) {
      toast.error("Pick an employee first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("staff_schedules").insert({
      staff_member_id: person.id,
      staff_name: person.name,
      department: person.department,
      work_date: date,
      start_time: start,
      end_time: end,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.code === "23505" ? "That shift is already on the schedule." : "Couldn't save the shift.",
      );
      return;
    }
    setNotes("");
    toast.success(`${person.name} scheduled for ${dayLabel(date)}.`);
    await load();
  }

  async function removeShift(id: string) {
    const { error } = await supabase.from("staff_schedules").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't remove that shift.");
      return;
    }
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleSupervisor(member: Member) {
    const { error } = await supabase
      .from("staff_members")
      .update({ is_supervisor: !member.is_supervisor })
      .eq("id", member.id);
    if (error) {
      toast.error("Couldn't change supervisor access.");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, is_supervisor: !m.is_supervisor } : m)),
    );
    toast.success(
      `${member.name} is ${member.is_supervisor ? "no longer" : "now"} a housekeeping supervisor.`,
    );
  }

  return (
    <section className="mt-12 border border-cream/15 bg-cream/[0.04] p-6">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        Workforce
      </p>
      <h2 className="mt-3 font-display text-2xl">Employee schedule</h2>
      <p className="mt-2 max-w-2xl text-sm text-cream/60">
        Build the week for each employee. Housekeepers see only their own shifts and their own
        assigned rooms; supervisors see the full board and who is cleaning what.
      </p>

      <div className="mt-5 grid gap-3 border border-cream/15 bg-ink/40 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <select
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          className="h-10 border border-cream/20 bg-ink px-3 text-sm text-cream lg:col-span-2"
        >
          {members.length === 0 ? <option value="">No employees yet</option> : null}
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · {m.department.replace("_", " ")}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="h-10 border-cream/20 bg-ink text-cream"
        />
        <Input
          type="time"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="h-10 border-cream/20 bg-ink text-cream"
        />
        <Input
          type="time"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          className="h-10 border-cream/20 bg-ink text-cream"
        />
        <Button
          disabled={busy}
          onClick={() => void addShift()}
          className="h-10 bg-amber text-ink hover:bg-amber/90"
        >
          Add shift
        </Button>
        <Input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Note (optional) — e.g. rear block"
          className="h-10 border-cream/20 bg-ink text-cream lg:col-span-6"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => {
            const d = new Date(`${weekStart}T12:00:00`);
            d.setDate(d.getDate() - 7);
            setWeekStart(d.toISOString().slice(0, 10));
          }}
          className="border-cream/25 bg-transparent text-cream/80 hover:bg-cream/10 hover:text-cream"
        >
          ← Previous week
        </Button>
        <span className="text-sm text-cream/70">
          {dayLabel(days[0]!)} – {dayLabel(days[6]!)}
        </span>
        <Button
          variant="outline"
          onClick={() => {
            const d = new Date(`${weekStart}T12:00:00`);
            d.setDate(d.getDate() + 7);
            setWeekStart(d.toISOString().slice(0, 10));
          }}
          className="border-cream/25 bg-transparent text-cream/80 hover:bg-cream/10 hover:text-cream"
        >
          Next week →
        </Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const list = shifts.filter((s) => s.work_date === day);
          return (
            <div key={day} className="border border-cream/15 bg-ink/40 p-3">
              <p className="text-xs uppercase tracking-wide text-cream/55">{dayLabel(day)}</p>
              {list.length === 0 ? (
                <p className="mt-2 text-xs text-cream/40">No shifts</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {list.map((shift) => (
                    <li key={shift.id} className="border border-cream/15 bg-cream/[0.04] p-2">
                      <p className="text-sm">{shift.staff_name}</p>
                      <p className="text-xs text-cream/60">
                        {timeLabel(shift.start_time)} – {timeLabel(shift.end_time)}
                      </p>
                      {shift.notes ? (
                        <p className="mt-1 text-[11px] text-cream/50">{shift.notes}</p>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void removeShift(shift.id)}
                        className="mt-1 text-[11px] uppercase tracking-wide text-clay hover:text-cream"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="font-display text-lg">Supervisor access</h3>
        <p className="mt-1 text-sm text-cream/60">
          Supervisors see every room and every housekeeper's assignments.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {members
            .filter((m) => m.department === "housekeeping")
            .map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => void toggleSupervisor(member)}
                  className={`border px-3 py-2 text-sm transition ${
                    member.is_supervisor
                      ? "border-amber bg-amber/20 text-cream"
                      : "border-cream/20 bg-ink/40 text-cream/70 hover:border-cream/40"
                  }`}
                >
                  {member.name}
                  <Badge className="ml-2 bg-cream/15 text-[10px] text-cream">
                    {member.is_supervisor ? "Supervisor" : "Housekeeper"}
                  </Badge>
                </button>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}

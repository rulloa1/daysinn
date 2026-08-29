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
        .select(
          "id, staff_member_id, staff_name, department, work_date, start_time, end_time, notes",
        )
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
      const { error } = await supabase
        .from("shift_room_assignments")
        .delete()
        .eq("id", existing.id);
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
        error.code === "23505"
          ? "That shift is already on the schedule."
          : "Couldn't save the shift.",
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
    <section>
      <p className="signage flex items-center gap-2 text-brand-gold">
        <span aria-hidden className="h-3 w-[3px] bg-brand-gold" />
        Workforce
      </p>
      <h2 className="mt-3 font-serif text-2xl font-bold text-brand-blue">Employee schedule</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Build the week for each employee. Housekeepers see only their own shifts and their own
        assigned rooms; supervisors see the full board and who is cleaning what.
      </p>

      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <select
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 lg:col-span-2"
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
          className="h-10 border-slate-300 bg-white text-slate-800"
        />
        <Input
          type="time"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="h-10 border-slate-300 bg-white text-slate-800"
        />
        <Input
          type="time"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          className="h-10 border-slate-300 bg-white text-slate-800"
        />
        <Button
          disabled={busy}
          onClick={() => void addShift()}
          className="h-10 bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
        >
          Add shift
        </Button>
        <Input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Note (optional) — e.g. rear block"
          className="h-10 border-slate-300 bg-white text-slate-800 lg:col-span-6"
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
          className="border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Previous week
        </Button>
        <span className="text-sm font-semibold text-slate-700">
          {dayLabel(days[0]!)} – {dayLabel(days[6]!)}
        </span>
        <Button
          variant="outline"
          onClick={() => {
            const d = new Date(`${weekStart}T12:00:00`);
            d.setDate(d.getDate() + 7);
            setWeekStart(d.toISOString().slice(0, 10));
          }}
          className="border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50"
        >
          Next week →
        </Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const list = shifts.filter((s) => s.work_date === day);
          return (
            <div key={day} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                {dayLabel(day)}
              </p>
              {list.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">No shifts</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {list.map((shift) => {
                    const count = shiftRooms.filter((r) => r.schedule_id === shift.id).length;
                    const active = shift.id === activeShiftId;
                    return (
                      <li
                        key={shift.id}
                        className={`rounded-lg border p-2 transition ${
                          active
                            ? "border-brand-blue bg-[#E7EDF5]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveShiftId(active ? null : shift.id)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-semibold text-slate-800">{shift.staff_name}</p>
                          <p className="text-xs text-slate-500">
                            {timeLabel(shift.start_time)} – {timeLabel(shift.end_time)}
                          </p>
                          <p className="mt-1 text-[11px] font-bold tracking-wide text-[#B45309] uppercase">
                            {count} room{count === 1 ? "" : "s"} · {active ? "editing" : "assign"}
                          </p>
                        </button>
                        {shift.notes ? (
                          <p className="mt-1 text-[11px] text-slate-500">{shift.notes}</p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void removeShift(shift.id)}
                          className="mt-1 text-[11px] font-semibold tracking-wide text-rose-600 uppercase hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-serif text-lg font-bold text-brand-blue">Rooms for this shift</h3>
          {activeShift ? (
            <Badge className="bg-[#E7EDF5] text-[11px] text-[#004986]">
              {activeShift.staff_name} · {dayLabel(activeShift.work_date)} ·{" "}
              {timeLabel(activeShift.start_time)}–{timeLabel(activeShift.end_time)}
            </Badge>
          ) : null}
          <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={onlyDirty}
              onChange={(event) => setOnlyDirty(event.target.checked)}
              className="h-4 w-4 accent-[#004986]"
            />
            Dirty rooms only
          </label>
          <Button
            disabled={busy || !activeShift || activeRooms.length === 0}
            onClick={() => void pushToBoard()}
            className="h-9 bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
          >
            Send to housekeeping board
          </Button>
        </div>

        {!activeShift ? (
          <p className="mt-3 text-sm text-slate-500">
            Pick a shift above to give that housekeeper specific rooms for that date and time.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              {activeRooms.length === 0
                ? "No rooms on this shift yet."
                : `Assigned: ${activeRooms.map((r) => r.room_number).join(", ")}`}
            </p>
            <div className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto">
              {rooms
                .filter((room) => (onlyDirty ? room.status === "vacant_dirty" : true))
                .map((room) => {
                  const picked = activeRoomNumbers.has(room.number);
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => void toggleRoom(room)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                        picked
                          ? "border-brand-blue bg-brand-blue text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {room.number}
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <h3 className="font-serif text-lg font-bold text-brand-blue">Supervisor access</h3>
        <p className="mt-1 text-sm text-slate-600">
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
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    member.is_supervisor
                      ? "border-brand-blue bg-[#E7EDF5] text-[#004986]"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {member.name}
                  <Badge className="ml-2 bg-slate-100 text-[10px] text-slate-600">
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

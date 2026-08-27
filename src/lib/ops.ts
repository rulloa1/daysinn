import { supabase } from "@/integrations/supabase/client";

export type RoomStatusValue =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "out_of_order" | "reserved";

export type StaffMember = {
  id: string;
  name: string;
  active: boolean;
  department?: string;
};

export type StaffIdentity = { id: string | null; name: string } | null;

export type RoomStatusEvent = {
  id: string;
  room_number: string;
  old_status: RoomStatusValue | null;
  new_status: RoomStatusValue;
  staff_name: string | null;
  duration_seconds: number | null;
  is_turnover: boolean;
  changed_at: string;
};

/** A turnover = the clean cycle that ends when a dirty room is made ready. */
export function isTurnover(oldStatus: RoomStatusValue | null, newStatus: RoomStatusValue) {
  return oldStatus === "vacant_dirty" && newStatus === "vacant_clean";
}

/**
 * Append a room status change to the audit log. Every entry carries room,
 * staff, old/new status, timestamp and the elapsed time in the previous
 * status, so turnover/response reports can be built later without a
 * schema change.
 */
export async function logRoomStatusChange(input: {
  roomId: string;
  roomNumber: string;
  oldStatus: RoomStatusValue | null;
  newStatus: RoomStatusValue;
  previousChangedAt: string | null;
  staff: StaffIdentity;
}) {
  const changedAt = new Date();
  const previousChangedAt = input.previousChangedAt ? Date.parse(input.previousChangedAt) : NaN;
  const duration = Number.isFinite(previousChangedAt)
    ? Math.max(0, Math.round((changedAt.getTime() - previousChangedAt) / 1000))
    : null;

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("room_status_events").insert({
    room_id: input.roomId,
    room_number: input.roomNumber,
    old_status: input.oldStatus,
    new_status: input.newStatus,
    staff_member_id: input.staff?.id ?? null,
    staff_name: input.staff?.name ?? null,
    changed_by: userData.user?.id ?? null,
    previous_changed_at: input.previousChangedAt,
    duration_seconds: duration,
    is_turnover: isTurnover(input.oldStatus, input.newStatus),
    changed_at: changedAt.toISOString(),
  });

  if (error) return { ok: false as const, error };
  return { ok: true as const };
}

export function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

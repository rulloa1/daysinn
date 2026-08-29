export interface BookingSnapshot {
  room: string;
  room_type: string | null;
  check_in: string;
  check_out: string;
  guests: number | null;
}

export interface BookingChange {
  label: string;
  from: string;
  to: string;
}

/** Formats an ISO date (YYYY-MM-DD) as a readable, timezone-safe label. */
export function formatStayDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = iso.split("-").map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Returns the guest-visible changes between two booking snapshots. */
export function diffBooking(before: BookingSnapshot, after: BookingSnapshot): BookingChange[] {
  const changes: BookingChange[] = [];

  if (before.check_in !== after.check_in) {
    changes.push({
      label: "Check-in",
      from: formatStayDate(before.check_in),
      to: formatStayDate(after.check_in),
    });
  }
  if (before.check_out !== after.check_out) {
    changes.push({
      label: "Check-out",
      from: formatStayDate(before.check_out),
      to: formatStayDate(after.check_out),
    });
  }
  if ((before.guests ?? null) !== (after.guests ?? null)) {
    changes.push({
      label: "Guests",
      from: String(before.guests ?? ""),
      to: String(after.guests ?? ""),
    });
  }
  if (before.room !== after.room) {
    changes.push({ label: "Room", from: before.room, to: after.room });
  }
  if ((before.room_type ?? "") !== (after.room_type ?? "")) {
    changes.push({
      label: "Room type",
      from: before.room_type ?? "",
      to: after.room_type ?? "",
    });
  }

  return changes;
}

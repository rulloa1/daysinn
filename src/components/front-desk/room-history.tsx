import { useState } from "react";
import { formatDuration, timeAgo, type RoomStatusEvent } from "@/lib/ops";
import { DB_STATUS_LABEL } from "@/lib/room-model";

/** Collapsible audit trail of status changes for the open room. */
export function RoomHistory({ history }: { history: RoomStatusEvent[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="signage text-cream/60 underline-offset-4 transition-colors duration-200 hover:text-amber hover:underline"
      >
        {open ? "Hide room history" : "Room history"} ({history.length})
      </button>
      {open ? (
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1 text-xs">
          {history.length === 0 ? (
            <li className="text-cream/45">No status changes logged yet.</li>
          ) : (
            history.slice(0, 12).map((event) => (
              <li key={event.id} className="border border-cream/15 bg-cream/[0.03] px-3 py-2">
                <p className="text-cream/85">
                  {event.old_status ? DB_STATUS_LABEL[event.old_status] : "—"} →{" "}
                  {DB_STATUS_LABEL[event.new_status]}
                </p>
                <p className="mt-1 text-cream/50">
                  {event.staff_name ?? "Unattributed"} · {timeAgo(event.changed_at)}
                  {event.is_turnover && event.duration_seconds != null
                    ? ` · turnover ${formatDuration(event.duration_seconds)}`
                    : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

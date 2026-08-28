import { timeAgo } from "@/lib/ops";
import { Panel } from "./primitives";
import type { BookingRow, RequestRow, RoomRow } from "./types";

const ROW_CLASS =
  "flex items-center justify-between border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm";

function BookingRows({ rows, empty }: { rows: BookingRow[]; empty: string }) {
  if (rows.length === 0) return <li className="text-sm text-cream/45">{empty}</li>;
  return (
    <>
      {rows.map((b) => (
        <li key={b.id} className={ROW_CLASS}>
          <span>Room {b.room}</span>
          <span className="text-cream/55">{b.guest_name}</span>
        </li>
      ))}
    </>
  );
}

/** Arrivals, departures and the open request queue, down the right of the board. */
export function BoardSidebar({
  arrivals,
  departures,
  requests,
  rooms,
  onSelectRoom,
}: {
  arrivals: BookingRow[];
  departures: BookingRow[];
  requests: RequestRow[];
  rooms: RoomRow[];
  onSelectRoom: (id: string) => void;
}) {
  return (
    <aside className="space-y-8">
      <Panel title="Arriving today">
        <BookingRows rows={arrivals} empty="Nothing scheduled." />
      </Panel>

      <Panel title="Departing today">
        <BookingRows rows={departures} empty="Nothing scheduled." />
      </Panel>

      <Panel title="Open requests">
        {requests.length === 0 ? (
          <li className="text-sm text-cream/45">Queue is clear.</li>
        ) : (
          requests.slice(0, 8).map((req) => (
            <li key={req.id} className={ROW_CLASS}>
              <button
                type="button"
                className="text-left underline-offset-4 hover:text-amber hover:underline"
                onClick={() => {
                  const match = rooms.find((r) => r.number === req.room);
                  if (match) onSelectRoom(match.id);
                }}
              >
                Room {req.room} · {req.type}
              </button>
              <span className="text-cream/45">{timeAgo(req.created_at)}</span>
            </li>
          ))
        )}
      </Panel>
    </aside>
  );
}

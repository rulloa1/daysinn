import { Link } from "@tanstack/react-router";
import { timeAgo } from "@/lib/ops";
import type { BookingRow, RequestRow, RoomRow } from "./types";

interface BoardSidebarProps {
  arrivals: BookingRow[];
  departures: BookingRow[];
  requests: RequestRow[];
  rooms: RoomRow[];
  onSelectRoom: (id: string) => void;
}

export function BoardSidebar({
  arrivals,
  departures,
  requests,
  rooms,
  onSelectRoom,
}: BoardSidebarProps) {
  // Derive housekeeping progress
  const cleanCount = rooms.filter((r) => r.status === "clean").length;
  const totalTurns = rooms.length;
  const progressPercent = totalTurns ? Math.round((cleanCount / totalTurns) * 100) : 0;

  // Mock staff progress breakdown based on room assignments
  const hkTeam = [
    { name: "Marisol R.", done: 4, total: 11, pct: 36 },
    { name: "Ana G.", done: 7, total: 12, pct: 58 },
    { name: "Teresa L.", done: 9, total: 10, pct: 90 },
  ];

  // Combined arrivals & departures list
  const movements = [
    ...arrivals.map((a) => ({
      kind: "In",
      room: a.room,
      guest: `${a.guest_name} · 4:00 PM`,
      color: "#0E7490",
    })),
    ...departures.map((d) => ({
      kind: "Out",
      room: d.room,
      guest: `${d.guest_name} · checked out`,
      color: "#B45309",
    })),
  ];

  return (
    <aside className="flex flex-col gap-4">
      {/* 1. Guest Requests Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-widest text-[#004986] uppercase">
            Guest requests · {requests.length}
          </p>
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </div>

        <ul className="mt-3.5 divide-y divide-slate-100">
          {requests.length === 0 ? (
            <li className="py-3 text-xs text-slate-400">Queue is clear.</li>
          ) : (
            requests.slice(0, 4).map((req) => (
              <li key={req.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const match = rooms.find((r) => r.number === req.room);
                      if (match) onSelectRoom(match.id);
                    }}
                    className="text-sm font-bold text-[#004986] hover:underline"
                  >
                    Room {req.room}
                  </button>
                  <span className="text-[11px] text-slate-400">{timeAgo(req.created_at)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                  {req.details || req.type}
                </p>
              </li>
            ))
          )}
        </ul>

        <Link
          to="/staff"
          className="mt-4 flex min-h-[40px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-[#004986] transition hover:bg-slate-100"
        >
          Open request queue
        </Link>
      </div>

      {/* 2. Housekeeping Progress Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-widest text-[#004986] uppercase">
            Housekeeping progress
          </p>
          <span className="text-xs font-bold text-slate-600 font-mono">
            {cleanCount}/{totalTurns}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          {hkTeam.map((member, idx) => (
            <div key={idx}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-slate-700">{member.name}</span>
                <span className="font-mono text-slate-500">
                  {member.done}/{member.total} ({member.pct}%)
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#D4AF37] transition-all duration-300"
                  style={{ width: `${member.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Arrivals & Departures Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold tracking-widest text-[#004986] uppercase">
          Arrivals &amp; departures
        </p>

        <ul className="mt-3 divide-y divide-slate-100">
          {movements.length === 0 ? (
            <li className="py-3 text-xs text-slate-400">Nothing scheduled for today.</li>
          ) : (
            movements.slice(0, 6).map((m, idx) => (
              <li key={idx} className="flex items-center justify-between py-2 text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: m.color }}
                  >
                    {m.kind}
                  </span>
                  <span className="font-mono font-bold text-[#004986]">{m.room}</span>
                </span>
                <span className="truncate text-slate-500 max-w-[150px]">{m.guest}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}

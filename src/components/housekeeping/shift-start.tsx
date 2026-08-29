import { useEffect, useState } from "react";
import type { RoomRow } from "@/components/housekeeping/types";

const STATUS_DOT: Record<string, string> = {
  vacant_clean: "#16A34A",
  vacant_dirty: "#F5A524",
  occupied: "#0065AB",
  occupied_dnd: "#7C3AED",
  reserved: "#D4AF37",
  out_of_order: "#B91C1C",
};

const STATUS_SHORT: Record<string, string> = {
  vacant_clean: "Ready",
  vacant_dirty: "Turn",
  occupied: "In house",
  occupied_dnd: "DND",
  reserved: "Arriving",
  out_of_order: "Out of order",
};

/**
 * The "start your shift" hand-off screen from the staff phone app design.
 * It confirms the rooms already assigned to this housekeeper and lets them
 * pick up unclaimed rooms nearby before the route view opens.
 */
export function ShiftStart({
  staffName,
  assigned,
  claimable,
  onToggleClaim,
  onStart,
}: {
  staffName: string;
  assigned: RoomRow[];
  claimable: RoomRow[];
  onToggleClaim: (room: RoomRow, toMe: boolean) => void;
  onStart: () => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const clock = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const estimate = assigned.length ? `~${Math.round(assigned.length * 0.65 * 10) / 10} hrs` : "—";

  return (
    <div className="overflow-hidden rounded-3xl border border-[#8B9CB3] bg-[#A8B7CA] shadow-lg">
      <div className="bg-[#004986] px-5 pt-3.5 pb-5">
        <div className="flex items-center justify-between text-[0.72rem] font-bold text-white">
          <span className="tabular-nums">{clock}</span>
          <span className="flex items-center gap-1.5 text-[0.6rem] tracking-[0.14em] text-white/65 uppercase">
            <span className="h-[7px] w-[7px] rounded-full bg-emerald-400" />
            Online
          </span>
        </div>
        <p className="mt-4 text-[0.65rem] font-bold tracking-[0.18em] text-[#D4AF37] uppercase">
          {today}
        </p>
        <h2 className="mt-1.5 font-serif text-[1.45rem] font-bold text-white">Start your shift</h2>
        <p className="mt-1.5 text-[0.88rem] leading-relaxed text-white/70">
          {staffName}, you have {assigned.length} {assigned.length === 1 ? "room" : "rooms"} on your
          sheet.
        </p>
      </div>

      <div className="px-5 py-[18px] pb-6">
        <div className="rounded-2xl border border-[#9FAEC2] bg-[#D8E1EC] px-4 py-4">
          <div className="flex items-baseline justify-between gap-2.5">
            <span className="text-[0.62rem] font-bold tracking-[0.14em] text-[#4C5C74] uppercase">
              Assigned to you
            </span>
            <span className="text-[0.78rem] font-bold text-[#004986]">{estimate}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {assigned.length === 0 ? (
              <p className="text-[0.82rem] text-[#4C5C74]">
                Nothing assigned yet — claim a room below.
              </p>
            ) : (
              assigned.map((room) => (
                <span
                  key={room.id}
                  className="flex items-center gap-2 rounded-[10px] border border-[#9FAEC2] bg-[#C9D4E1] px-3 py-2 text-[0.9rem] font-bold tabular-nums text-[#004986]"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: STATUS_DOT[room.status] ?? "#4C5C74" }}
                  />
                  {room.number}
                </span>
              ))
            )}
          </div>
        </div>

        {claimable.length > 0 ? (
          <>
            <p className="mt-5 text-[0.62rem] font-bold tracking-[0.14em] text-[#4C5C74] uppercase">
              Unclaimed nearby · tap to add
            </p>
            <div className="mt-2.5 flex flex-col gap-2">
              {claimable.slice(0, 6).map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onToggleClaim(room, true)}
                  className="flex min-h-16 w-full items-center gap-3.5 rounded-xl border border-[#9FAEC2] bg-[#D8E1EC] px-4 py-3 text-left transition active:translate-y-[1px]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-[#9FAEC2] bg-transparent text-[#004986]">
                    +
                  </span>
                  <span className="text-[1.15rem] font-bold tabular-nums text-[#004986]">
                    {room.number}
                  </span>
                  <span className="min-w-0 flex-1 text-[0.8rem] leading-snug text-[#4C5C74]">
                    {room.notes || `Floor ${room.floor} · ${room.bed_type || "Standard"}`}
                  </span>
                  <span
                    className="text-[0.72rem] font-bold whitespace-nowrap"
                    style={{ color: STATUS_DOT[room.status] ?? "#4C5C74" }}
                  >
                    {STATUS_SHORT[room.status] ?? room.status}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        <button
          type="button"
          onClick={onStart}
          className="mt-5 min-h-14 w-full rounded-2xl bg-[#D4AF37] text-base font-bold text-[#004986] transition active:translate-y-[1px]"
        >
          Start your shift
        </button>
      </div>
    </div>
  );
}

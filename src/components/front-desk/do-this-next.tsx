import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { BookingRow, RequestRow, RoomRow } from "./types";

interface DoThisNextProps {
  rooms: RoomRow[];
  requests: RequestRow[];
  arrivals: BookingRow[];
  onPrioritizeRooms?: (roomNumbers: string[]) => void;
  onOpenRequests?: () => void;
}

export function DoThisNext({
  rooms,
  requests,
  arrivals,
  onPrioritizeRooms,
  onOpenRequests,
}: DoThisNextProps) {
  const [dismissed, setDismissed] = useState(false);

  // Compute recommendation
  const recommendation = useMemo(() => {
    // 1. Check unready rooms for arrivals today
    const unreadyArrivals = arrivals.filter((arrival) => {
      const room = rooms.find((r) => r.number === arrival.room);
      return room && room.status !== "vacant_clean" && room.status !== "occupied";
    });

    if (unreadyArrivals.length > 0) {
      const roomNumbers = unreadyArrivals.map((a) => a.room);
      const unassigned = unreadyArrivals.filter((a) => {
        const room = rooms.find((r) => r.number === a.room);
        return !room?.guest_name && (!room?.wing || room?.status === "vacant_dirty");
      });

      return {
        type: "arrivals_risk",
        eyebrow: "Do this next",
        title: `${arrivals.length} arrival${arrivals.length > 1 ? "s" : ""} today, ${unreadyArrivals.length} room${unreadyArrivals.length > 1 ? "s" : ""} not ready`,
        body: `Room${roomNumbers.length > 1 ? "s" : ""} ${roomNumbers.join(" and ")} are still vacant dirty and assigned to arriving guests. Prioritize housekeeping turns to ensure seamless check-ins.`,
        primaryAction: `Prioritise ${roomNumbers.join(" & ")}`,
        onPrimary: () => {
          onPrioritizeRooms?.(roomNumbers);
          toast.success(`Priority flagged for Room ${roomNumbers.join(", ")}`);
        },
        secondaryAction: "Message housekeeping",
        onSecondary: () => {
          toast.info("Opening housekeeping message dispatch...");
        },
        watchChips: [
          {
            color: "#D4AF37",
            text: `Turns in progress · ${rooms.filter((r) => r.status === "vacant_dirty").length} rooms`,
          },
          {
            color: unassigned.length > 0 ? "#F0705F" : "#34D399",
            text:
              unassigned.length > 0
                ? `${unassigned.length} unassigned`
                : "All housekeepers assigned",
          },
          {
            color: "#34D399",
            text: `${rooms.filter((r) => r.status === "vacant_clean").length} rooms ready to sell`,
          },
        ],
      };
    }

    // 2. Check SLA breaches in open requests (requests older than 15 minutes)
    const now = Date.now();
    const urgentRequest = requests.find((req) => {
      const created = new Date(req.created_at).getTime();
      return now - created > 15 * 60 * 1000;
    });

    if (urgentRequest) {
      return {
        type: "sla_breach",
        eyebrow: "Do this next · Priority SLA",
        title: `Room ${urgentRequest.room} request waiting for attention`,
        body: `Guest requested ${urgentRequest.type} (${urgentRequest.details || "Pending action"}). Service standard target is under 10 minutes.`,
        primaryAction: `Resolve Room ${urgentRequest.room}`,
        onPrimary: () => {
          onOpenRequests?.();
        },
        secondaryAction: "View queue",
        onSecondary: () => {
          onOpenRequests?.();
        },
        watchChips: [
          {
            color: "#F0705F",
            text: `Open request: Room ${urgentRequest.room}`,
          },
          {
            color: "#34D399",
            text: `${requests.length} total queue requests`,
          },
        ],
      };
    }

    // 3. Calm state
    const readyCount = rooms.filter((r) => r.status === "vacant_clean").length;
    return {
      type: "calm",
      eyebrow: "Shift status",
      title: "All arrival rooms on schedule",
      body: `Shift is running smoothly. ${readyCount} rooms are ready to sell with ${requests.length} open guest request${requests.length === 1 ? "" : "s"}.`,
      primaryAction: "Review room board",
      onPrimary: () => {
        toast.info("Room board is up to date.");
      },
      secondaryAction: undefined,
      onSecondary: undefined,
      watchChips: [
        {
          color: "#34D399",
          text: `${readyCount} rooms ready to sell`,
        },
        {
          color: "#34D399",
          text: `${arrivals.length} arrivals on track`,
        },
      ],
    };
  }, [rooms, requests, arrivals, onPrioritizeRooms, onOpenRequests]);

  if (dismissed) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <span className="text-xs font-semibold text-slate-500">
          Recommendation dismissed for current shift
        </span>
        <button
          type="button"
          onClick={() => setDismissed(false)}
          className="text-xs font-bold text-[#004986] hover:underline"
        >
          Restore panel
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col justify-between rounded-2xl bg-[#004986] p-6 text-white shadow-sm md:p-7">
      <div>
        <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">
          {recommendation.eyebrow}
        </p>
        <h2 className="mt-2.5 font-serif text-2xl font-bold leading-snug tracking-tight md:text-[1.65rem]">
          {recommendation.title}
        </h2>
        <p className="mt-2.5 max-w-xl text-[0.92rem] leading-relaxed text-white/80">
          {recommendation.body}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={recommendation.onPrimary}
            className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#004986] shadow-sm transition hover:bg-[#D4AF37]/90 active:scale-[0.99]"
          >
            {recommendation.primaryAction}
          </button>

          {recommendation.secondaryAction ? (
            <button
              type="button"
              onClick={recommendation.onSecondary}
              className="rounded-xl border border-white/35 bg-transparent px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {recommendation.secondaryAction}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="px-3 py-3 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      </div>

      {recommendation.watchChips.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/18 pt-4">
          {recommendation.watchChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs text-white/90"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: chip.color }}
                aria-hidden="true"
              />
              {chip.text}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

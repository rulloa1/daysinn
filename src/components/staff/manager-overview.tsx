import { useMemo } from "react";
import { AlertTriangle, BedDouble, Clock, Sparkles } from "lucide-react";
import {
  LIVE_ATTENTION,
  LIVE_STATUS_META,
  LIVE_STATUS_ORDER,
  liveStatusForRoom,
  type LiveStatus,
} from "@/lib/live-map-status";
import { StuckRoomAlerts } from "./stuck-room-alerts";
import type { QueueRoom } from "./use-request-queue";
import type { RequestRow } from "./types";

function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function ago(iso: string): string {
  const mins = minutesSince(iso);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}

/**
 * Manager dashboard: one screen that folds the three things a manager checks
 * separately — live room statuses, housekeeping progress, and the front-desk
 * items that need a decision. It reads the same live queue data the map and
 * queue tabs use, so everything updates with the realtime feed.
 */
export function ManagerOverview({
  rooms,
  requests,
  onOpenQueue,
  onOpenMap,
}: {
  rooms: QueueRoom[];
  requests: RequestRow[];
  onOpenQueue: () => void;
  onOpenMap: () => void;
}) {
  const live = useMemo(
    () =>
      rooms.map((room) => ({
        room,
        status: liveStatusForRoom({
          status: room.status,
          dnd: room.dnd ?? null,
          hk_stage: room.hk_stage ?? null,
        }),
      })),
    [rooms],
  );

  const byStatus = useMemo(() => {
    const counts = new Map<LiveStatus, number>();
    for (const entry of live) counts.set(entry.status, (counts.get(entry.status) ?? 0) + 1);
    return counts;
  }, [live]);

  const housekeeping = useMemo(() => {
    const turns = live.filter(
      (e) => e.status === "vacant_dirty" || e.status === "cleaning" || e.status === "vacant_clean",
    );
    const remaining = live.filter((e) => e.status === "vacant_dirty").length;
    const inProgress = live.filter((e) => e.status === "cleaning").length;
    const ready = live.filter((e) => e.status === "vacant_clean").length;
    const total = turns.length;
    const percent = total === 0 ? 100 : Math.round((ready / total) * 100);
    const byStaff = new Map<string, { cleaning: number; waiting: number }>();
    for (const entry of live) {
      if (entry.status !== "cleaning" && entry.status !== "vacant_dirty") continue;
      const name = entry.room.assigned_name?.trim() || "Unassigned";
      const row = byStaff.get(name) ?? { cleaning: 0, waiting: 0 };
      if (entry.status === "cleaning") row.cleaning += 1;
      else row.waiting += 1;
      byStaff.set(name, row);
    }
    return {
      remaining,
      inProgress,
      ready,
      total,
      percent,
      staff: [...byStaff.entries()].sort((a, b) =>
        a[0] === "Unassigned" ? 1 : b[0] === "Unassigned" ? -1 : a[0].localeCompare(b[0]),
      ),
    };
  }, [live]);

  const attention = useMemo(() => {
    const openRequests = requests
      .filter((r) => r.status !== "done")
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const aging = openRequests.filter((r) => minutesSince(r.created_at) >= 30);
    const blockedRooms = live.filter((e) => e.status === "out_of_order").map((e) => e.room.number);
    const dndRooms = live.filter((e) => e.status === "occupied_dnd").map((e) => e.room.number);
    const arrivals = live.filter((e) => e.status === "reserved").length;
    return { openRequests, aging, blockedRooms, dndRooms, arrivals };
  }, [live, requests]);

  return (
    <div className="space-y-4">
      <section className="op-card p-6">
        <Header
          icon={<BedDouble className="h-4 w-4" />}
          title="Live room status"
          note={`${rooms.length} rooms · updates in real time`}
          actionLabel="Open property map"
          onAction={onOpenMap}
        />
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {LIVE_STATUS_ORDER.map((status) => {
            const meta = LIVE_STATUS_META[status];
            const value = byStatus.get(status) ?? 0;
            return (
              <button
                key={status}
                type="button"
                onClick={onOpenMap}
                title={`Open the property map · ${meta.mapLabel}`}
                className="rounded-xl border border-[#D8E0EA] p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[#004986] focus-visible:outline-none"
                style={{ background: meta.chip }}
              >
                <p
                  className="text-[1.35rem] leading-none font-semibold tabular-nums"
                  style={{ color: meta.color }}
                >
                  {value}
                </p>
                <p className="mt-1.5 text-[0.68rem] font-bold tracking-[0.1em] text-slate-500 uppercase">
                  {meta.short}
                </p>
                <p className="mt-1 text-[0.68rem] text-slate-500">{meta.mapLabel}</p>
              </button>
            );
          })}
        </div>

      </section>

      <StuckRoomAlerts rooms={rooms} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="op-card p-6">
          <Header
            icon={<Sparkles className="h-4 w-4" />}
            title="Housekeeping progress"
            note={`${housekeeping.ready} of ${housekeeping.total} turnable rooms ready`}
          />
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E4EAF2]">
              <div
                className="h-full rounded-full bg-[#16A34A] transition-all"
                style={{ width: `${housekeeping.percent}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
              <span>{housekeeping.percent}% complete</span>
              <span className="text-[#7A5AF8]">{housekeeping.inProgress} being cleaned</span>
              <span className="text-[#B45309]">{housekeeping.remaining} still to turn</span>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {housekeeping.staff.length === 0 ? (
              <li className="rounded-lg border border-[#D8E0EA] bg-[#F5F8FC] p-3 text-xs text-slate-500">
                Every room is turned — nothing in the housekeeping board right now.
              </li>
            ) : (
              housekeeping.staff.map(([name, row]) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-[#D8E0EA] bg-white px-3 py-2.5"
                >
                  <span className="text-sm font-semibold text-slate-800">{name}</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {row.cleaning} cleaning · {row.waiting} waiting
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="op-card p-6">
          <Header
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Front-desk attention"
            note={`${attention.openRequests.length} open ${
              attention.openRequests.length === 1 ? "request" : "requests"
            }`}
            actionLabel="Open queue"
            onAction={onOpenQueue}
          />
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Metric label="Aging 30m+" value={attention.aging.length} tone="#B91C1C" />
            <Metric label="Arrivals held" value={attention.arrivals} tone="#0E7490" />
            <Metric label="Out of order" value={attention.blockedRooms.length} tone="#B91C1C" />
            <Metric label="DND deferred" value={attention.dndRooms.length} tone="#7C3AED" />
          </div>

          <ul className="mt-4 space-y-2">
            {attention.openRequests.slice(0, 5).map((request) => (
              <li
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#D8E0EA] bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    Room {request.room} · {request.type}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {request.details ?? "No extra detail"}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {ago(request.created_at)}
                </span>
              </li>
            ))}
            {attention.openRequests.length === 0 ? (
              <li className="rounded-lg border border-[#D8E0EA] bg-[#F5F8FC] p-3 text-xs text-slate-500">
                The queue is clear. Nothing is waiting on the front desk.
              </li>
            ) : null}
          </ul>

          {attention.blockedRooms.length > 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Blocked rooms: {attention.blockedRooms.join(", ")}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Header({
  icon,
  title,
  note,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-[#004986]">
        {icon}
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <span className="text-xs font-semibold text-slate-500">{note}</span>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg border border-[#C4D0DE] bg-[#EDF2F8] px-3 py-1.5 text-xs font-bold text-[#004986] hover:bg-[#E1E9F3]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-[#D8E0EA] bg-[#F5F8FC] p-3">
      <p className="text-[1.25rem] leading-none font-semibold tabular-nums" style={{ color: tone }}>
        {value}
      </p>
      <p className="mt-1.5 text-[0.66rem] font-bold tracking-[0.1em] text-slate-500 uppercase">
        {label}
      </p>
    </div>
  );
}

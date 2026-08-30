import { useEffect, useMemo, useState } from "react";
import { AlarmClock, Settings2 } from "lucide-react";
import { LIVE_STATUS_META, liveStatusForRoom } from "@/lib/live-map-status";
import type { QueueRoom } from "./use-request-queue";

const STORE_KEY = "ops.stuck-room-thresholds.v1";

export type StuckThresholds = {
  /** Minutes a room may sit in Do Not Disturb before it is flagged. */
  dndMinutes: number;
  /** Minutes a room may sit mid-clean before it is flagged. */
  cleaningMinutes: number;
  enabled: boolean;
};

const DEFAULTS: StuckThresholds = { dndMinutes: 240, cleaningMinutes: 45, enabled: true };

const CHOICES = [15, 30, 45, 60, 90, 120, 180, 240, 360, 480];

function loadThresholds(): StuckThresholds {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<StuckThresholds>;
    return {
      dndMinutes: Number(parsed.dndMinutes) || DEFAULTS.dndMinutes,
      cleaningMinutes: Number(parsed.cleaningMinutes) || DEFAULTS.cleaningMinutes,
      enabled: parsed.enabled !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

/** Thresholds live in the browser so each manager can tune their own alerting. */
export function useStuckThresholds() {
  const [thresholds, setThresholds] = useState<StuckThresholds>(DEFAULTS);

  useEffect(() => setThresholds(loadThresholds()), []);

  function update(next: Partial<StuckThresholds>) {
    setThresholds((prev) => {
      const merged = { ...prev, ...next };
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(merged));
      } catch {
        /* private mode — alerts still work for this session */
      }
      return merged;
    });
  }

  return { thresholds, update };
}

export type StuckRoom = {
  number: string;
  kind: "occupied_dnd" | "cleaning";
  minutes: number;
  assigned: string | null;
};

/** Rooms whose current DND / mid-clean state has outlasted its threshold. */
export function findStuckRooms(rooms: QueueRoom[], thresholds: StuckThresholds): StuckRoom[] {
  if (!thresholds.enabled) return [];
  const now = Date.now();
  const out: StuckRoom[] = [];
  for (const room of rooms) {
    const status = liveStatusForRoom({
      status: room.status,
      dnd: room.dnd ?? null,
      hk_stage: room.hk_stage ?? null,
    });
    if (status !== "occupied_dnd" && status !== "cleaning") continue;
    if (!room.updated_at) continue;
    const minutes = Math.floor((now - new Date(room.updated_at).getTime()) / 60000);
    const limit = status === "cleaning" ? thresholds.cleaningMinutes : thresholds.dndMinutes;
    if (minutes < limit) continue;
    out.push({
      number: room.number,
      kind: status,
      minutes,
      assigned: room.assigned_name?.trim() || null,
    });
  }
  return out.sort((a, b) => b.minutes - a.minutes);
}

function duration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/**
 * Configurable "stuck room" alerts: rooms that have been on Do Not Disturb or
 * mid-clean longer than the manager's chosen window. Re-evaluated on a ticking
 * clock so a room crosses the threshold without needing a new database event.
 */
export function StuckRoomAlerts({ rooms }: { rooms: QueueRoom[] }) {
  const { thresholds, update } = useStuckThresholds();
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const stuck = useMemo(
    () => findStuckRooms(rooms, thresholds),
    // `tick` re-runs the elapsed-time comparison every minute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rooms, thresholds, tick],
  );

  return (
    <section className="op-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#004986]">
          <AlarmClock className="h-4 w-4" />
          <h2 className="text-base font-bold text-slate-900">Stuck room alerts</h2>
          <span className="text-xs font-semibold text-slate-500">
            {thresholds.enabled
              ? `DND over ${duration(thresholds.dndMinutes)} · cleaning over ${duration(thresholds.cleaningMinutes)}`
              : "Alerts paused"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#C4D0DE] bg-[#EDF2F8] px-3 py-1.5 text-xs font-bold text-[#004986] hover:bg-[#E1E9F3]"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {open ? "Hide settings" : "Alert settings"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-[#D8E0EA] bg-[#F5F8FC] p-4 sm:grid-cols-3">
          <label className="text-xs font-bold tracking-[0.08em] text-slate-500 uppercase">
            DND longer than
            <select
              value={thresholds.dndMinutes}
              onChange={(e) => update({ dndMinutes: Number(e.target.value) })}
              className="mt-1.5 block w-full rounded-lg border border-[#C4D0DE] bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 normal-case"
            >
              {CHOICES.map((m) => (
                <option key={m} value={m}>
                  {duration(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold tracking-[0.08em] text-slate-500 uppercase">
            Cleaning longer than
            <select
              value={thresholds.cleaningMinutes}
              onChange={(e) => update({ cleaningMinutes: Number(e.target.value) })}
              className="mt-1.5 block w-full rounded-lg border border-[#C4D0DE] bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 normal-case"
            >
              {CHOICES.map((m) => (
                <option key={m} value={m}>
                  {duration(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={thresholds.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="h-4 w-4 rounded border-[#C4D0DE]"
            />
            Alerts on
          </label>
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {stuck.length === 0 ? (
          <li className="rounded-lg border border-[#D8E0EA] bg-[#F5F8FC] p-3 text-xs text-slate-500">
            {thresholds.enabled
              ? "No rooms have exceeded their DND or cleaning window."
              : "Turn alerts on to watch for rooms stuck on DND or mid-clean."}
          </li>
        ) : (
          stuck.map((room) => {
            const meta = LIVE_STATUS_META[room.kind];
            return (
              <li
                key={`${room.kind}-${room.number}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#D8E0EA] bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    Room {room.number} · {meta.label}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {room.assigned ? `Assigned to ${room.assigned}` : meta.note}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ background: meta.chip, color: meta.color }}
                >
                  {duration(room.minutes)}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BrandLockup } from "@/components/brand-lockup";
import { LivePropertyMap } from "@/components/live-property-map";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import {
  LIVE_ATTENTION,
  LIVE_EVENT_TEXT,
  LIVE_STATUS_META,
  LIVE_STATUS_ORDER,
  type LiveStatus,
} from "@/lib/live-map-status";

type LiveRoom = {
  id: string;
  number: string;
  floor: number;
  status: LiveStatus;
  updated_at: string;
  assigned_name: string | null;
  hk_stage: string | null;
  guest_name: string | null;
  bed_type: string | null;
  wing: string | null;
};

function relativeTime(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export const Route = createFileRoute("/live-room-status")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live Property Map — Days Inn Hub" },
      {
        name: "description",
        content:
          "A dedicated, live-updating front-desk map of housekeeping completions and current room status across the property.",
      },
      { property: "og:title", content: "Live Property Map — Days Inn Hub" },
      {
        property: "og:description",
        content: "Real-time room readiness, turns, and exceptions on the Days Inn Wildwood site plan.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LiveRoomStatusPage,
});

function LiveRoomStatusPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="live-map flex min-h-screen items-center justify-center text-sm font-semibold text-[var(--lm-body)]">
        Loading live property map…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="live-map flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--lm-border)] bg-[var(--lm-panel)] p-8">
          <BrandLockup />
          <p className="mt-8 text-[0.6875rem] font-bold tracking-[0.16em] text-[var(--lm-gold-ink)] uppercase">
            Front desk
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[var(--lm-blue)]">
            Live property map
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--lm-body)]">
            Sign in with a staff account to monitor housekeeping progress and current room status.
          </p>
          <Button asChild className="mt-6 w-full bg-[var(--lm-blue)] text-white hover:opacity-90">
            <Link to="/staff">Go to staff sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <LiveBoard />;
}

function LiveBoard() {
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [floor, setFloor] = useState<1 | 2>(1);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async (manual = false) => {
    if (!isSupabaseConfigured) {
      setLoadError("The live data service is not configured.");
      setLoading(false);
      return;
    }

    if (manual) setRefreshing(true);
    const { data, error } = await supabase
      .from("rooms")
      .select(
        "id, number, floor, status, updated_at, assigned_name, hk_stage, guest_name, bed_type, wing",
      )
      .order("floor")
      .order("number");

    if (error) {
      setLoadError("Unable to load live room status. Please try again.");
      if (manual) toast.error("Unable to refresh live room status.");
    } else {
      setRooms((data ?? []) as LiveRoom[]);
      setLastRefresh(new Date().toISOString());
      setLoadError(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useRealtimeRefresh({
    channel: "front-desk-live-room-status",
    tables: ["rooms", "room_status_events"],
    enabled: isSupabaseConfigured,
    onRefresh: () => load(),
  });

  useEffect(() => {
    if (!isSupabaseConfigured) void load();
  }, [load]);

  const floorRooms = useMemo(
    () => rooms.filter((room) => (floor === 1 ? Number(room.number) < 200 : Number(room.number) >= 200)),
    [rooms, floor],
  );

  const counts = useMemo(() => {
    const summary = {} as Record<LiveStatus, number>;
    for (const status of LIVE_STATUS_ORDER) {
      summary[status] = floorRooms.filter((room) => room.status === status).length;
    }
    return summary;
  }, [floorRooms]);

  const dimmed = useMemo(() => {
    if (!attentionOnly) return new Set<string>();
    return new Set(
      floorRooms.filter((room) => !LIVE_ATTENTION.has(room.status)).map((room) => room.number),
    );
  }, [attentionOnly, floorRooms]);

  const attention = useMemo(
    () =>
      floorRooms
        .filter((room) => LIVE_ATTENTION.has(room.status))
        .sort(
          (a, b) =>
            [...LIVE_ATTENTION].indexOf(a.status) - [...LIVE_ATTENTION].indexOf(b.status) ||
            Number(a.number) - Number(b.number),
        ),
    [floorRooms],
  );

  const feed = useMemo(
    () =>
      [...rooms]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5),
    [rooms],
  );

  const selectedRoom = useMemo(
    () => floorRooms.find((room) => room.number === selected) ?? null,
    [floorRooms, selected],
  );

  const occupancy = floorRooms.length
    ? Math.round(
        (((counts.occupied ?? 0) + (counts.occupied_dnd ?? 0)) / floorRooms.length) * 100,
      )
    : 0;

  const floorLabel = floor === 1 ? "ground floor" : "upper floor";

  return (
    <main className="live-map min-h-screen px-[clamp(12px,3vw,28px)] pt-[clamp(14px,3vw,26px)] pb-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center justify-center rounded-lg bg-white px-2.5 py-[7px]">
            <img src={logoAsset.url} alt="Days Inn" className="block h-[26px] w-auto" />
          </span>
          <div>
            <p className="text-[0.6875rem] font-bold tracking-[0.18em] text-[var(--lm-body-strong)] uppercase">
              Wildwood I-75 · 551 East SR 44
            </p>
            <h1 className="mt-1.5 font-serif text-[clamp(1.35rem,4vw,1.9rem)] font-bold tracking-tight text-[var(--lm-blue)]">
              Live property map
            </h1>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <Link
              to="/front-desk"
              className="text-[0.78rem] font-bold text-[var(--lm-blue)] hover:underline"
            >
              Front desk board
            </Link>
            <Link
              to="/housekeeping"
              className="text-[0.78rem] font-bold text-[var(--lm-blue)] hover:underline"
            >
              Housekeeping
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-[9px] rounded-full border border-[#0F7B4F] bg-[#E7F4EE] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-[#0F7B4F]">
            <span className="relative inline-flex h-[9px] w-[9px]">
              <span className="absolute inset-0 rounded-full bg-[#0F7B4F] [animation:lm-ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <span className="relative h-[9px] w-[9px] rounded-full bg-[#0F7B4F]" />
            </span>
            Live · {lastRefresh ? relativeTime(lastRefresh) : "connecting…"}
          </span>

          <div className="flex gap-1 rounded-[10px] border border-[var(--lm-border)] bg-[var(--lm-panel)] p-1">
            {([1, 2] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFloor(value)}
                aria-pressed={floor === value}
                className={`min-h-11 rounded-[7px] px-4 py-2.5 text-[0.78rem] font-bold ${
                  floor === value
                    ? "bg-[var(--lm-blue)] text-white"
                    : "bg-transparent text-[var(--lm-body-strong)]"
                }`}
              >
                {value === 1 ? "Ground floor" : "Upper floor"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAttentionOnly((prev) => !prev)}
            aria-pressed={attentionOnly}
            className={`min-h-11 rounded-[10px] border px-4 py-2.5 text-[0.78rem] font-bold ${
              attentionOnly
                ? "border-[var(--lm-gold)] bg-[#FBF3DC] text-[var(--lm-gold-ink)]"
                : "border-[var(--lm-border)] bg-[var(--lm-panel)] text-[var(--lm-body-strong)]"
            }`}
          >
            {attentionOnly ? "Showing needs attention" : "Highlight needs attention"}
          </button>

          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            className="min-h-11 rounded-[10px] border-[var(--lm-border)] bg-[var(--lm-panel)] text-[0.78rem] font-bold text-[var(--lm-body-strong)] hover:bg-[var(--lm-plate)]"
            onClick={() => void load(true)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loadError ? (
        <section className="mt-4 rounded-2xl border border-[#B91C1C] bg-[#FBEAE9] p-5">
          <p className="font-bold text-[#B91C1C]">Live data unavailable</p>
          <p className="mt-1 text-sm text-[var(--lm-body)]">{loadError}</p>
        </section>
      ) : null}

      <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-2.5">
        {LIVE_STATUS_ORDER.map((status) => {
          const meta = LIVE_STATUS_META[status];
          return (
            <div
              key={status}
              className="flex items-center justify-between gap-2.5 rounded-xl border border-[var(--lm-border)] bg-[var(--lm-panel)] px-4 py-[13px]"
            >
              <span className="flex items-center gap-[9px] text-[0.68rem] font-bold tracking-[0.12em] text-[var(--lm-body-strong)] uppercase">
                <span className="h-[9px] w-[9px] rounded-full" style={{ background: meta.color }} />
                {meta.short}
              </span>
              <span className="text-[1.35rem] leading-none font-semibold tabular-nums text-[var(--lm-blue)]">
                {counts[status] ?? 0}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3.5 flex flex-wrap items-start gap-3.5">
        {loading ? (
          <p className="text-sm font-semibold text-[var(--lm-body)]">Loading live rooms…</p>
        ) : (
          <LivePropertyMap
            pins={floorRooms}
            selected={selected}
            dimmed={dimmed}
            shownLabel={`${floorRooms.length} rooms · ${floorLabel}`}
            onSelect={setSelected}
          />
        )}

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
          <div className="rounded-2xl border border-[var(--lm-border)] bg-[var(--lm-panel)] px-5 py-[18px]">
            <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-[var(--lm-gold-ink)] uppercase">
              Live feed
            </p>
            <ul className="mt-3 flex flex-col">
              {feed.length === 0 ? (
                <li className="py-2 text-sm text-[var(--lm-body)]">No room activity yet.</li>
              ) : (
                feed.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center gap-2.5 border-b border-[var(--lm-rule)] py-[9px] text-[0.8rem]"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: LIVE_STATUS_META[room.status].color }}
                    />
                    <span className="min-w-0 flex-1 text-[var(--lm-body-strong)]">
                      <strong className="text-[var(--lm-blue)]">{room.number}</strong>{" "}
                      {LIVE_EVENT_TEXT[room.status]}
                    </span>
                    <span className="shrink-0 text-[0.72rem] tabular-nums text-[var(--lm-muted)]">
                      {clockTime(room.updated_at)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {selectedRoom ? (
            <div className="rounded-2xl border border-[var(--lm-border)] bg-[var(--lm-panel)] px-5 py-[18px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-[var(--lm-gold-ink)] uppercase">
                    Selected room
                  </p>
                  <p className="mt-2 text-[clamp(2rem,7vw,2.6rem)] leading-none font-semibold tabular-nums text-[var(--lm-blue)]">
                    {selectedRoom.number}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1.5 text-[0.68rem] font-bold tracking-[0.08em] uppercase"
                  style={{
                    background: LIVE_STATUS_META[selectedRoom.status].chip,
                    color: LIVE_STATUS_META[selectedRoom.status].color,
                  }}
                >
                  {LIVE_STATUS_META[selectedRoom.status].label}
                </span>
              </div>

              <table className="mt-4 w-full border-collapse text-[0.85rem]">
                <tbody>
                  {[
                    { label: "Guest", value: selectedRoom.guest_name ?? "Vacant" },
                    { label: "Room type", value: selectedRoom.bed_type ?? "—" },
                    { label: "Wing", value: selectedRoom.wing ?? "—" },
                    { label: "Housekeeper", value: selectedRoom.assigned_name ?? "—" },
                    {
                      label: "Housekeeping",
                      value: selectedRoom.hk_stage?.replace(/_/g, " ") ?? "—",
                    },
                    { label: "Updated", value: relativeTime(selectedRoom.updated_at) },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="w-[46%] border-b border-[var(--lm-rule)] py-[9px] pr-2.5 text-[var(--lm-body)]">
                        {row.label}
                      </td>
                      <td className="border-b border-[var(--lm-rule)] py-[9px] font-semibold text-[var(--lm-blue)]">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  to="/front-desk"
                  className="flex min-h-11 items-center justify-center rounded-[10px] bg-[var(--lm-blue)] text-[0.82rem] font-bold text-white"
                >
                  Change status
                </Link>
                <Link
                  to="/housekeeping"
                  className="flex min-h-11 items-center justify-center rounded-[10px] border border-[var(--lm-border-strong)] bg-[var(--lm-plate)] text-[0.82rem] font-semibold text-[var(--lm-blue)]"
                >
                  Send to housekeeping
                </Link>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--lm-border)] bg-[var(--lm-panel)] px-5 py-[18px]">
            <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-[var(--lm-blue)] uppercase">
              Needs attention · {attention.length}
            </p>
            <ul className="mt-3.5 flex flex-col">
              {attention.length === 0 ? (
                <li className="py-2 text-sm text-[var(--lm-body)]">
                  Nothing outstanding on this floor.
                </li>
              ) : (
                attention.slice(0, 7).map((room) => {
                  const meta = LIVE_STATUS_META[room.status];
                  return (
                    <li key={room.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(room.number)}
                        className="flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--lm-rule)] py-2.5 text-left"
                      >
                        <span
                          className="h-8 w-1 rounded-full"
                          style={{ background: meta.color }}
                        />
                        <span className="text-[1.05rem] font-bold tabular-nums text-[var(--lm-blue)]">
                          {room.number}
                        </span>
                        <span className="min-w-0 flex-1 text-[0.78rem] leading-[1.35] text-[var(--lm-body)]">
                          {meta.note}
                        </span>
                        <span
                          className="text-[0.62rem] font-bold tracking-[0.08em] uppercase"
                          style={{ color: meta.color }}
                        >
                          {meta.short}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--lm-border)] bg-[var(--lm-panel)] px-5 py-[18px]">
            <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-[var(--lm-blue)] uppercase">
              This floor
            </p>
            <div className="mt-3.5 grid grid-cols-2 gap-3.5">
              {[
                { label: "Rooms on floor", value: String(floorRooms.length) },
                { label: "Ready to sell", value: String(counts.vacant_clean ?? 0) },
                { label: "To turn", value: String(counts.vacant_dirty ?? 0) },
                { label: "Occupancy", value: `${occupancy}%` },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[0.62rem] font-bold tracking-[0.12em] text-[var(--lm-body)] uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-[1.4rem] leading-none font-semibold tabular-nums text-[var(--lm-blue)]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

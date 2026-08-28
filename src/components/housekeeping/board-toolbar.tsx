import { Footprints } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BoardFilter, BoardView } from "./types";

const TOGGLE_ON = "border-status-clean/50 bg-status-clean/10 text-status-clean";
const TOGGLE_OFF = "border-cream/20 text-cream/55 hover:text-cream";

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`signage flex items-center gap-1.5 rounded-md px-3 py-2 transition-colors duration-200 ${
        active ? "bg-amber font-bold text-ink shadow-sm" : "text-cream/60 hover:text-cream"
      }`}
    >
      {children}
    </button>
  );
}

/** Sticky control strip: room search, filters, alert toggles and view switch. */
export function BoardToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  view,
  onViewChange,
  toCleanCount,
  mineCount,
  alerts,
}: {
  query: string;
  onQueryChange: (next: string) => void;
  filter: BoardFilter;
  onFilterChange: (next: BoardFilter) => void;
  view: BoardView;
  onViewChange: (next: BoardView) => void;
  toCleanCount: number;
  mineCount: number;
  alerts: {
    alertsOn: boolean;
    pushOn: boolean;
    pushSupported: boolean;
    toggleAlerts: () => void;
    togglePush: () => Promise<void>;
  };
}) {
  const filters: [BoardFilter, string][] = [
    ["all", "All rooms"],
    ["dirty", `Priority (${toCleanCount})`],
    ["mine", `My rooms (${mineCount})`],
  ];

  return (
    <section
      className="sticky top-0 z-20 -mx-3 mt-4 border-y border-cream/10 bg-ink/95 px-3 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6"
      aria-label="Housekeeping board controls"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Input
          value={query}
          inputMode="numeric"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Find a room number…"
          aria-label="Find a room number"
          className="h-11 max-w-xl border-cream/20 bg-cream/[0.04] text-base text-cream placeholder:text-cream/35"
        />
        <div
          className="flex snap-x gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] xl:overflow-visible xl:pb-0"
          role="group"
          aria-label="Room filters"
        >
          {filters.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              aria-pressed={filter === key}
              className={`signage shrink-0 snap-start rounded-lg border px-3.5 py-2.5 transition-colors duration-200 ${
                filter === key
                  ? "border-amber bg-amber text-ink shadow-sm"
                  : "border-cream/20 bg-cream/[0.03] text-cream/65 hover:border-cream/40 hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Alerts">
          <button
            type="button"
            onClick={alerts.toggleAlerts}
            aria-pressed={alerts.alertsOn}
            className={`signage rounded-md border px-3 py-2 transition-colors duration-200 ${
              alerts.alertsOn ? TOGGLE_ON : TOGGLE_OFF
            }`}
          >
            {alerts.alertsOn ? "Live alerts on" : "Live alerts off"}
          </button>
          {alerts.pushSupported ? (
            <button
              type="button"
              onClick={() => void alerts.togglePush()}
              aria-pressed={alerts.pushOn}
              className={`signage rounded-md border px-3 py-2 transition-colors duration-200 ${
                alerts.pushOn ? TOGGLE_ON : TOGGLE_OFF
              }`}
            >
              {alerts.pushOn ? "Phone alerts on" : "Phone alerts off"}
            </button>
          ) : null}
        </div>

        <div
          className="flex items-center rounded-lg border border-cream/20 bg-cream/[0.04] p-1"
          role="group"
          aria-label="Board view"
        >
          <ViewButton active={view === "grid"} onClick={() => onViewChange("grid")}>
            Grid
          </ViewButton>
          <ViewButton active={view === "runner"} onClick={() => onViewChange("runner")}>
            <Footprints className="h-3.5 w-3.5" />
            <span>Runner</span>
          </ViewButton>
          <ViewButton active={view === "map"} onClick={() => onViewChange("map")}>
            Property map
          </ViewButton>
        </div>
      </div>
    </section>
  );
}

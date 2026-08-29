import { DEFAULT_ROOM_COORDS } from "@/components/floor-plan";
import propertyMapImage from "@/assets/property-site-plan.svg";
import { LIVE_STATUS_META, LIVE_STATUS_ORDER, type LiveStatus } from "@/lib/live-map-status";

export type LivePin = {
  id: string;
  number: string;
  status: LiveStatus;
};

type Props = {
  pins: LivePin[];
  selected: string | null;
  dimmed: Set<string>;
  flash?: string | null;
  shownLabel: string;
  onSelect: (roomNumber: string) => void;
};

/**
 * The property site plan with one solid status pill per room, positioned from
 * the shared calibrated coordinates so this view and the front-desk board
 * always agree about where a room sits.
 */
export function LivePropertyMap({ pins, selected, dimmed, flash, shownLabel, onSelect }: Props) {
  return (
    <section
      className="min-w-0 flex-[1_1_620px] rounded-2xl border border-[var(--lm-border-strong)] bg-[var(--lm-panel-strong)] p-[clamp(10px,2vw,14px)] shadow-[0_10px_15px_rgba(0,36,63,0.12)]"
      aria-label="Live property map"
    >
      <div className="overflow-x-auto rounded-xl bg-[var(--lm-plate)]">
        <div className="relative w-full min-w-[660px] bg-[var(--lm-plate)] [container-type:inline-size]">
          <img
            src={propertyMapImage}
            alt="Days Inn Wildwood site plan"
            className="block h-auto w-full select-none"
          />

          {pins.map((pin) => {
            const coords = DEFAULT_ROOM_COORDS[pin.number];
            if (!coords) return null;
            const meta = LIVE_STATUS_META[pin.status];
            const isSelected = selected === pin.number;
            return (
              <button
                key={pin.id}
                type="button"
                title={`Room ${pin.number} · ${meta.label}`}
                onClick={() => onSelect(pin.number)}
                className="absolute flex min-h-[clamp(13px,1.5cqi,18px)] min-w-[clamp(19px,2.1cqi,26px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] border px-[0.3cqi] font-mono text-[clamp(7.5px,1.02cqi,11px)] leading-[1.15] font-bold shadow-[0_1px_2px_rgba(0,36,63,0.3)] transition-opacity"
                style={{
                  left: `${coords[0]}%`,
                  top: `${coords[1]}%`,
                  zIndex: isSelected ? 15 : 10,
                  background: isSelected ? "var(--lm-blue-deep)" : meta.pill,
                  color: isSelected ? "#ffffff" : meta.pillFg,
                  borderColor: isSelected ? "var(--lm-gold)" : meta.color,
                  opacity: dimmed.has(pin.number) ? 0.25 : 1,
                  animation: flash === pin.number ? "lm-flash 2.6s ease-out 1" : "none",
                }}
              >
                {pin.number}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {LIVE_STATUS_ORDER.map((status) => (
            <span
              key={status}
              className="flex items-center gap-[7px] text-[0.72rem] font-semibold text-[var(--lm-body-strong)]"
            >
              <span
                className="h-[9px] w-[9px] rounded-full"
                style={{ background: LIVE_STATUS_META[status].color }}
              />
              {LIVE_STATUS_META[status].label}
            </span>
          ))}
        </div>
        <span className="text-[0.72rem] font-bold text-[var(--lm-body)]">
          {shownLabel} · tap a room for details
        </span>
      </div>
    </section>
  );
}

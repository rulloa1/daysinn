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
      className="min-w-0 flex-[1_1_620px] rounded-[22px] border border-[#C7D5E4] bg-[#E7EEF6] p-[clamp(8px,1.4vw,12px)] shadow-[0_18px_40px_rgba(0,36,63,0.18)]"
      aria-label="Live property map"
    >
      <div className="overflow-x-auto rounded-[16px] bg-[#DDE6F0] p-[clamp(4px,0.8vw,8px)]">
        <div className="relative w-full min-w-[660px] overflow-hidden rounded-[12px] [container-type:inline-size]">
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
                className="absolute flex min-h-[clamp(14px,1.65cqi,20px)] min-w-[clamp(21px,2.35cqi,29px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[5px] border px-[0.35cqi] text-[clamp(8px,1.08cqi,12px)] leading-[1.15] font-extrabold tracking-[0.01em] shadow-[0_2px_4px_rgba(0,36,63,0.35)] transition-transform hover:scale-[1.08]"
                style={{
                  left: `${coords[0]}%`,
                  top: `${coords[1]}%`,
                  zIndex: isSelected ? 15 : 10,
                  background: meta.pill,
                  color: meta.pillFg,
                  borderColor: isSelected ? "#0B2545" : "rgba(255,255,255,0.55)",
                  boxShadow: isSelected
                    ? "0 0 0 2px #0B2545, 0 3px 6px rgba(0,36,63,0.4)"
                    : undefined,
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

      <div className="mt-[clamp(6px,1vw,10px)] rounded-[14px] bg-white px-[clamp(12px,2vw,20px)] py-[clamp(10px,1.6vw,14px)] shadow-[0_2px_6px_rgba(0,36,63,0.08)]">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
          {LIVE_STATUS_ORDER.map((status) => (
            <span
              key={status}
              className="flex items-center gap-2 text-[0.82rem] font-semibold text-slate-700"
            >
              <span
                className="h-[11px] w-[11px] rounded-full"
                style={{ background: LIVE_STATUS_META[status].pill }}
              />
              {LIVE_STATUS_META[status].mapLabel}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[0.78rem] font-semibold text-slate-500">
          {shownLabel} · tap a room for details
        </p>
      </div>
    </section>
  );
}


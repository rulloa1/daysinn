import propertyMapAsset from "@/assets/property-site-plan.jpg.asset.json";
import { LIVE_STATUS_META, LIVE_STATUS_ORDER, type LiveStatus } from "@/lib/live-map-status";

const propertyMapImage = propertyMapAsset.url;

/**
 * Pin centers measured directly off the illustrated site plan artwork
 * (property-site-plan.jpg), expressed as percentages of the image box.
 */
export const SITE_PLAN_COORDS: Record<string, [number, number]> = {
  "108": [27.21, 61.52],
  "109": [27.21, 68.01],
  "110": [30.63, 61.52],
  "111": [30.63, 68.01],
  "112": [34.06, 61.52],
  "113": [34.06, 68.01],
  "114": [37.37, 61.52],
  "115": [37.37, 68.01],
  "116": [40.7, 61.52],
  "117": [40.7, 68.01],
  "118": [44.01, 61.52],
  "119": [44.01, 68.01],
  "120": [47.29, 61.52],
  "121": [47.29, 68.01],
  "122": [50.6, 61.52],
  "123": [50.6, 68.01],
  "124": [53.88, 61.52],
  "125": [53.88, 68.01],
  "126": [57.16, 61.52],
  "127": [57.16, 68.01],
  "128": [60.42, 61.52],
  "129": [60.42, 68.01],
  "130": [63.7, 61.52],
  "131": [63.7, 68.01],
  "132": [66.95, 61.52],
  "133": [66.95, 68.01],
  "134": [70.16, 61.52],
  "135": [70.16, 68.01],
  "137": [73.65, 65.26],
  "139": [73.65, 61.56],
  "140": [69.14, 58.06],
  "141": [73.67, 58.06],
  "142": [69.14, 54.27],
  "143": [73.67, 54.27],
  "144": [69.14, 50.28],
  "145": [73.67, 50.28],
  "146": [69.14, 46.3],
  "147": [73.67, 46.3],
  "148": [69.14, 42.32],
  "149": [73.67, 42.32],
  "150": [69.14, 38.29],
  "151": [73.67, 38.29],
  "152": [69.14, 34.31],
  "153": [73.67, 34.31],
  "154": [69.14, 30.38],
  "155": [73.67, 30.38],
  "156": [69.14, 26.35],
  "157": [73.67, 26.35],
  "158": [69.14, 22.42],
  "159": [73.67, 22.42],
  "160": [69.14, 18.39],
  "161": [73.67, 18.39],
  "162": [69.14, 14.45],
  "163": [73.67, 14.45],
  // --- Upper floor: same building footprint, one level up. The four
  // back-of-house bays (GM office / kitchen / lobby / security) are guest
  // rooms 200-207 upstairs; 208-263 sit directly above 108-163.
  "200": [12.76, 61.52],
  "201": [12.76, 68.01],
  "202": [16.93, 61.52],
  "203": [16.93, 68.01],
  "204": [20.57, 61.52],
  "205": [20.57, 68.01],
  "206": [24.06, 61.52],
  "207": [24.06, 68.01],
  "208": [27.21, 61.52],
  "209": [27.21, 68.01],
  "210": [30.63, 61.52],
  "211": [30.63, 68.01],
  "212": [34.06, 61.52],
  "213": [34.06, 68.01],
  "214": [37.37, 61.52],
  "215": [37.37, 68.01],
  "216": [40.7, 61.52],
  "217": [40.7, 68.01],
  "218": [44.01, 61.52],
  "219": [44.01, 68.01],
  "220": [47.29, 61.52],
  "221": [47.29, 68.01],
  "222": [50.6, 61.52],
  "223": [50.6, 68.01],
  "224": [53.88, 61.52],
  "225": [53.88, 68.01],
  "226": [57.16, 61.52],
  "227": [57.16, 68.01],
  "228": [60.42, 61.52],
  "229": [60.42, 68.01],
  "230": [63.7, 61.52],
  "231": [63.7, 68.01],
  "232": [66.95, 61.52],
  "233": [66.95, 68.01],
  "234": [70.16, 61.52],
  "235": [70.16, 68.01],
  "237": [73.65, 65.26],
  "239": [73.65, 61.56],
  "240": [69.14, 58.06],
  "241": [73.67, 58.06],
  "242": [69.14, 54.27],
  "243": [73.67, 54.27],
  "244": [69.14, 50.28],
  "245": [73.67, 50.28],
  "246": [69.14, 46.3],
  "247": [73.67, 46.3],
  "248": [69.14, 42.32],
  "249": [73.67, 42.32],
  "250": [69.14, 38.29],
  "251": [73.67, 38.29],
  "252": [69.14, 34.31],
  "253": [73.67, 34.31],
  "254": [69.14, 30.38],
  "255": [73.67, 30.38],
  "256": [69.14, 26.35],
  "257": [73.67, 26.35],
  "258": [69.14, 22.42],
  "259": [73.67, 22.42],
  "260": [69.14, 18.39],
  "261": [73.67, 18.39],
  "262": [69.14, 14.45],
  "263": [73.67, 14.45],
};

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
            const coords = SITE_PLAN_COORDS[pin.number];
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


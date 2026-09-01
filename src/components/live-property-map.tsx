import { useState } from "react";
import propertyMapAsset from "@/assets/property-floor-plan.png.asset.json";
import { LIVE_STATUS_META, LIVE_STATUS_ORDER, type LiveStatus } from "@/lib/live-map-status";

const propertyMapImage = propertyMapAsset.url;

/**
 * Pin centers measured directly off the illustrated floor-plan artwork
 * (property-floor-plan.png, 1606x979), expressed as percentages of the image
 * box so the overlay always covers the printed room chips exactly.
 */
export const SITE_PLAN_COORDS: Record<string, [number, number]> = {
  "108": [27.24, 62.41],
  "109": [27.12, 67.72],
  "110": [30.6, 62.31],
  "111": [30.48, 67.72],
  "112": [33.9, 62.41],
  "113": [33.84, 67.72],
  "114": [37.24, 62.41],
  "115": [37.14, 67.72],
  "116": [40.54, 62.36],
  "117": [40.47, 67.82],
  "118": [43.84, 62.36],
  "119": [43.74, 67.72],
  "120": [47.1, 62.41],
  "121": [47.07, 67.82],
  "122": [50.37, 62.41],
  "123": [50.34, 67.77],
  "124": [53.64, 62.41],
  "125": [53.61, 67.77],
  "126": [56.94, 62.41],
  "127": [56.94, 67.82],
  "128": [60.24, 62.36],
  "129": [60.24, 67.82],
  "130": [63.54, 62.41],
  "131": [63.54, 67.77],
  "132": [66.75, 63.59],
  "133": [66.78, 67.77],
  "134": [70.05, 63.64],
  "135": [70.05, 67.82],
  "137": [73.63, 66.96],
  "139": [73.6, 63.53],
  "140": [68.84, 59.86],
  "141": [73.41, 59.86],
  "142": [68.84, 56.18],
  "143": [73.41, 56.18],
  "144": [68.84, 52.45],
  "145": [73.41, 52.45],
  "146": [68.84, 48.77],
  "147": [73.41, 48.77],
  "148": [68.84, 45.05],
  "149": [73.41, 45.05],
  "150": [68.84, 41.37],
  "151": [73.41, 41.37],
  "152": [68.84, 37.64],
  "153": [73.41, 37.64],
  "154": [68.84, 33.91],
  "155": [73.41, 33.91],
  "156": [68.84, 30.18],
  "157": [73.41, 30.18],
  "158": [68.84, 26.35],
  "159": [73.41, 26.35],
  "160": [68.84, 22.63],
  "161": [73.41, 22.63],
  "162": [68.84, 18.9],
  "163": [73.41, 18.9],
  // --- Upper floor: same footprint one level up. The four ground-floor
  // back-of-house bays (GM office / kitchen / lobby / security) are guest
  // rooms 200-207 upstairs; 208-263 sit directly above 108-163.
  "200": [12.89, 62.41],
  "201": [12.89, 67.72],
  "202": [16.81, 62.41],
  "203": [16.81, 67.72],
  "204": [20.36, 62.41],
  "205": [20.36, 67.72],
  "206": [23.72, 62.41],
  "207": [23.72, 67.72],
  "208": [27.24, 62.41],
  "209": [27.12, 67.72],
  "210": [30.6, 62.31],
  "211": [30.48, 67.72],
  "212": [33.9, 62.41],
  "213": [33.84, 67.72],
  "214": [37.24, 62.41],
  "215": [37.14, 67.72],
  "216": [40.54, 62.36],
  "217": [40.47, 67.82],
  "218": [43.84, 62.36],
  "219": [43.74, 67.72],
  "220": [47.1, 62.41],
  "221": [47.07, 67.82],
  "222": [50.37, 62.41],
  "223": [50.34, 67.77],
  "224": [53.64, 62.41],
  "225": [53.61, 67.77],
  "226": [56.94, 62.41],
  "227": [56.94, 67.82],
  "228": [60.24, 62.36],
  "229": [60.24, 67.82],
  "230": [63.54, 62.41],
  "231": [63.54, 67.77],
  "232": [66.75, 63.59],
  "233": [66.78, 67.77],
  "234": [70.05, 63.64],
  "235": [70.05, 67.82],
  "237": [73.63, 66.96],
  "239": [73.6, 63.53],
  "240": [68.84, 59.86],
  "241": [73.41, 59.86],
  "242": [68.84, 56.18],
  "243": [73.41, 56.18],
  "244": [68.84, 52.45],
  "245": [73.41, 52.45],
  "246": [68.84, 48.77],
  "247": [73.41, 48.77],
  "248": [68.84, 45.05],
  "249": [73.41, 45.05],
  "250": [68.84, 41.37],
  "251": [73.41, 41.37],
  "252": [68.84, 37.64],
  "253": [73.41, 37.64],
  "254": [68.84, 33.91],
  "255": [73.41, 33.91],
  "256": [68.84, 30.18],
  "257": [73.41, 30.18],
  "258": [68.84, 26.35],
  "259": [73.41, 26.35],
  "260": [68.84, 22.63],
  "261": [73.41, 22.63],
  "262": [68.84, 18.9],
  "263": [73.41, 18.9],
};

export type LivePin = {
  id: string;
  number: string;
  status: LiveStatus;
  bed_type?: string | null;
  guest_name?: string | null;
  floor?: number | null;
};

type Props = {
  pins: LivePin[];
  selected: string | null;
  dimmed: Set<string>;
  flash?: string | null;
  shownLabel: string;
  onSelect: (roomNumber: string) => void;
};

function bedLabel(pin: LivePin) {
  const raw = (pin.bed_type ?? "").toString().trim();
  if (!raw) return "Guest room";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Small floating card anchored to a room chip. */
function RoomCard({
  pin,
  x,
  y,
  variant,
  onClose,
}: {
  pin: LivePin;
  x: number;
  y: number;
  variant: "hover" | "detail";
  onClose?: () => void;
}) {
  const meta = LIVE_STATUS_META[pin.status];
  const flipX = x > 62;
  const flipY = y < 30;
  return (
    <div
      className="pointer-events-none absolute z-30 w-[min(15.5cqi,230px)] rounded-[12px] border border-white/70 bg-white/97 p-[1.15cqi] text-left shadow-[0_10px_28px_rgba(0,36,63,0.32)] backdrop-blur-sm"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(${flipX ? "-104%" : "4%"}, ${flipY ? "6%" : "-104%"})`,
      }}
    >
      <div className="flex items-center gap-[0.7cqi]">
        <span
          className="rounded-[6px] px-[0.7cqi] py-[0.25cqi] text-[clamp(9px,1.15cqi,14px)] font-extrabold"
          style={{ background: meta.pill, color: meta.pillFg }}
        >
          {pin.number}
        </span>
        <span className="text-[clamp(9px,1.1cqi,13px)] font-bold text-[#0B2545]">
          {bedLabel(pin)}
        </span>
        {variant === "detail" && onClose ? (
          <button
            type="button"
            aria-label="Close room details"
            onClick={onClose}
            className="pointer-events-auto ml-auto text-[clamp(10px,1.2cqi,15px)] leading-none font-bold text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        ) : null}
      </div>
      <p
        className="mt-[0.5cqi] text-[clamp(8px,1cqi,12px)] font-bold"
        style={{ color: meta.color }}
      >
        {meta.mapLabel}
      </p>
      {variant === "detail" ? (
        <dl className="mt-[0.55cqi] space-y-[0.25cqi] text-[clamp(8px,0.98cqi,12px)] text-slate-600">
          <div className="flex justify-between gap-2">
            <dt>Floor</dt>
            <dd className="font-semibold text-[#0B2545]">
              {pin.floor ?? (Number(pin.number) >= 200 ? 2 : 1)}
            </dd>
          </div>
          {pin.guest_name ? (
            <div className="flex justify-between gap-2">
              <dt>Guest</dt>
              <dd className="truncate font-semibold text-[#0B2545]">{pin.guest_name}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt>Status</dt>
            <dd className="font-semibold" style={{ color: meta.color }}>
              {meta.label}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-[0.4cqi] text-[clamp(8px,0.95cqi,12px)] text-slate-500">
          Tap for room details
        </p>
      )}
    </div>
  );
}

/**
 * The illustrated property floor plan with one live status chip per room,
 * positioned from shared calibrated coordinates so this view and the
 * front-desk board always agree about where a room sits.
 */
export function LivePropertyMap({ pins, selected, dimmed, flash, shownLabel, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const detailPin = pins.find((p) => p.number === detail) ?? null;
  const hoverPin = hovered && hovered !== detail ? (pins.find((p) => p.number === hovered) ?? null) : null;

  return (
    <section
      className="min-w-0 flex-[1_1_620px] rounded-[22px] border border-[#C7D5E4] bg-[#E7EEF6] p-[clamp(8px,1.4vw,12px)] shadow-[0_18px_40px_rgba(0,36,63,0.18)]"
      aria-label="Live property map"
    >
      <div className="overflow-x-auto rounded-[16px] bg-[#DDE6F0] p-[clamp(4px,0.8vw,8px)]">
        <div className="relative w-full min-w-[660px] overflow-hidden rounded-[12px] [container-type:inline-size]">
          <img
            src={propertyMapImage}
            alt="Days Inn Wildwood illustrated floor plan"
            className="block h-auto w-full select-none"
          />

          {pins.map((pin) => {
            const coords = SITE_PLAN_COORDS[pin.number];
            if (!coords) return null;
            const meta = LIVE_STATUS_META[pin.status];
            const isSelected = selected === pin.number || detail === pin.number;
            const isHovered = hovered === pin.number;
            return (
              <button
                key={pin.id}
                type="button"
                title={`Room ${pin.number} · ${meta.label}`}
                onMouseEnter={() => setHovered(pin.number)}
                onMouseLeave={() => setHovered((cur) => (cur === pin.number ? null : cur))}
                onFocus={() => setHovered(pin.number)}
                onBlur={() => setHovered((cur) => (cur === pin.number ? null : cur))}
                onClick={() => {
                  setDetail((cur) => (cur === pin.number ? null : pin.number));
                  onSelect(pin.number);
                }}
                className="absolute flex min-h-[clamp(15px,2.05cqi,26px)] min-w-[clamp(24px,2.95cqi,38px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[6px] border px-[0.4cqi] text-[clamp(8px,1.15cqi,14px)] leading-[1.15] font-extrabold tracking-[0.01em] transition-transform duration-150 hover:scale-[1.12]"
                style={{
                  left: `${coords[0]}%`,
                  top: `${coords[1]}%`,
                  zIndex: isSelected ? 20 : isHovered ? 15 : 10,
                  background: meta.pill,
                  color: meta.pillFg,
                  borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.6)",
                  boxShadow: isSelected
                    ? "0 0 0 2.5px #7C3AED, 0 4px 10px rgba(0,36,63,0.4)"
                    : isHovered
                      ? "0 0 0 2.5px #FACC15, 0 4px 12px rgba(0,36,63,0.4)"
                      : "0 2px 4px rgba(0,36,63,0.35)",
                  opacity: dimmed.has(pin.number) ? 0.25 : 1,
                  animation: flash === pin.number ? "lm-flash 2.6s ease-out 1" : "none",
                }}
              >
                {pin.number}
              </button>
            );
          })}

          {hoverPin && SITE_PLAN_COORDS[hoverPin.number] ? (
            <RoomCard
              pin={hoverPin}
              x={SITE_PLAN_COORDS[hoverPin.number]![0]}
              y={SITE_PLAN_COORDS[hoverPin.number]![1]}
              variant="hover"
            />
          ) : null}

          {detailPin && SITE_PLAN_COORDS[detailPin.number] ? (
            <RoomCard
              pin={detailPin}
              x={SITE_PLAN_COORDS[detailPin.number]![0]}
              y={SITE_PLAN_COORDS[detailPin.number]![1]}
              variant="detail"
              onClose={() => setDetail(null)}
            />
          ) : null}
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

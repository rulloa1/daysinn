export type OpsStat = {
  label: string;
  value: string | number;
  trend?: string;
  trendTone?: "up" | "down" | "flat";
};

const TREND_COLOR: Record<NonNullable<OpsStat["trendTone"]>, string> = {
  up: "text-[#10A366]",
  down: "text-[#E4572E]",
  flat: "text-slate-400",
};

/** Divided inline metric strip from Ops Portal v3. */
export function OpsStatStrip({ stats }: { stats: OpsStat[] }) {
  return (
    <div className="flex flex-wrap items-center rounded-xl border border-[#9FAEC2] bg-[#D8E1EC] px-1.5 py-2.5">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`flex items-baseline gap-2.5 px-4.5 py-1 ${
            index < stats.length - 1 ? "border-r border-[#BFCAD8]" : ""
          }`}
        >
          <span className="text-[1.3rem] font-semibold tabular-nums text-[#004986]">
            {stat.value}
          </span>
          <span className="text-[0.66rem] font-bold tracking-[0.12em] text-slate-400 uppercase">
            {stat.label}
          </span>
          {stat.trend ? (
            <span className={`text-[0.72rem] ${TREND_COLOR[stat.trendTone ?? "flat"]}`}>
              {stat.trend}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

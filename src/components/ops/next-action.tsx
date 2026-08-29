import type { ReactNode } from "react";

export type WatchChip = { text: string; tone: "amber" | "sage" | "rose" | "sky" };

const CHIP_DOT: Record<WatchChip["tone"], string> = {
  amber: "bg-[#D4AF37]",
  sage: "bg-[#10A366]",
  rose: "bg-[#E4572E]",
  sky: "bg-[#4ECBD9]",
};

/**
 * The navy "Do this next" banner from Ops Portal v3 — one headline directive,
 * supporting detail, primary/secondary actions, and a watchlist column.
 */
export function NextActionCard({
  headline,
  detail,
  actions,
  watch = [],
  onDismiss,
}: {
  headline: string;
  detail: string;
  actions?: ReactNode;
  watch?: WatchChip[];
  onDismiss?: () => void;
}) {
  return (
    <section className="flex flex-wrap items-start justify-between gap-5 rounded-2xl bg-[#004986] px-6 py-5 text-white">
      <div className="min-w-[280px] flex-1">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#D4AF37] uppercase">
          Do this next
        </p>
        <h2 className="mt-2 font-serif text-[1.45rem] leading-tight font-bold text-pretty">
          {headline}
        </h2>
        <p className="mt-2 max-w-[44rem] text-sm leading-relaxed text-white/75 text-pretty">
          {detail}
        </p>
        {actions || onDismiss ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {actions}
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg px-2 py-2.5 text-[0.82rem] font-semibold text-white/65 transition hover:text-white"
              >
                Dismiss
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {watch.length ? (
        <div className="flex flex-col items-start gap-2">
          {watch.map((chip) => (
            <span
              key={chip.text}
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-xs text-white/85"
            >
              <span className={`h-[7px] w-[7px] rounded-full ${CHIP_DOT[chip.tone]}`} />
              {chip.text}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Gold primary button used inside the navy banner. */
export function NextActionButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === "primary"
          ? "rounded-lg bg-[#D4AF37] px-4.5 py-2.5 text-[0.82rem] font-bold text-[#004986] transition hover:brightness-105"
          : "rounded-lg border border-white/35 px-4.5 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-white/10"
      }
    >
      {children}
    </button>
  );
}

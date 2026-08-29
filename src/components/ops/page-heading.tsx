import type { ReactNode } from "react";

/** Eyebrow + Playfair headline + action cluster, per Ops Portal v3. */
export function OpsPageHeading({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-[2rem] leading-tight font-bold tracking-tight text-[#004986]">
          {title}
        </h1>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function OpsActionButton({
  children,
  onClick,
  variant = "secondary",
  badge,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === "primary"
          ? "rounded-[10px] bg-[#004986] px-5 py-3 text-[0.85rem] font-bold whitespace-nowrap text-white transition hover:bg-[#004986]/90"
          : "inline-flex items-center gap-2 rounded-[10px] border border-[#8B9CB3] bg-[#D8E1EC] px-5 py-3 text-[0.85rem] font-semibold whitespace-nowrap text-[#004986] transition hover:bg-[#CBD8E7]"
      }
    >
      {children}
      {badge !== undefined ? (
        <span className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#D4AF37] px-1 text-[0.72rem] font-bold text-[#004986]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

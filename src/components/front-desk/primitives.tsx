import type { ReactNode } from "react";

/** Titled list container used down the right-hand column of the board. */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        {title}
      </p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

/** Single headline number in the stat strip above the board. */
export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-cream/15 bg-cream/[0.03] px-5 py-4">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        {label}
      </p>
      <p className="mt-2 text-4xl">{value}</p>
    </div>
  );
}

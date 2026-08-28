import { Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import type { ReactNode } from "react";

import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import { FranchiseLegal } from "@/components/franchise-footer";
import { cn } from "@/lib/utils";

/**
 * Shared chrome and typographic primitives for the printed staff manuals
 * (/manuals/front-desk, /manuals/housekeeping, /manuals/manager).
 *
 * Everything here is presentational. Screen styling uses the brand tokens from
 * styles.css; the `print:` variants collapse the page furniture so a manual
 * prints as a clean document.
 */

export function ManualShell({
  title,
  intro,
  runningHead,
  children,
}: {
  title: string;
  intro: string;
  runningHead: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas-ops text-slate-800 print:bg-white">
      <header className="sticky top-0 z-30 border-b border-border-guest bg-white/95 backdrop-blur print:static print:border-b print:bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 md:px-8">
          <img src={logoAsset.url} alt="Days Inn" className="h-5 w-auto" />
          <span className="signage text-brand-blue">{runningHead}</span>
          <span className="ml-auto hidden text-xs text-slate-500 sm:block print:block">
            Days Inn® by Wyndham Wildwood I-75
          </span>
          <div className="flex items-center gap-2 print:hidden">
            <Link
              to="/manuals"
              className="inline-flex items-center gap-1.5 rounded-md border border-border-guest px-2.5 py-1.5 text-xs font-semibold text-brand-blue transition hover:bg-canvas-ops"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Manuals
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pt-10 pb-20 md:px-8 print:max-w-none print:px-0 print:pt-6">
        <h1 className="font-serif text-3xl leading-tight font-bold tracking-tight text-brand-blue md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-slate-600">{intro}</p>

        <div className="mt-2">{children}</div>

        <div className="mt-12 border-t border-border-guest pt-5 print:mt-8">
          <p className="text-xs text-slate-500">
            Front desk ·{" "}
            <a href="tel:+13527487766" className="font-semibold">
              (352) 748-7766
            </a>{" "}
            · Guest Hub staff portal
          </p>
          <div className="mt-2">
            <FranchiseLegal />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Numbered chapter heading, e.g. "3 · Status words and who owns them". */
export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-10 break-inside-avoid print:mt-8">
      <h2 className="font-serif text-xl font-bold text-brand-blue">
        <span className="tabular-nums">{n}</span> · {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

const CALLOUT_TONES = {
  gold: "border-l-4 border-brand-gold bg-[#F4F1E6]",
  amber: "border-l-4 border-[#B45309] bg-[#FBF0E2]",
  blue: "border border-border-guest bg-canvas-ops",
} as const;

const CALLOUT_LABEL = {
  gold: "text-[#8A6D1F]",
  amber: "text-[#8A5A12]",
  blue: "text-brand-blue",
} as const;

export function Callout({
  tone = "blue",
  title,
  children,
}: {
  tone?: keyof typeof CALLOUT_TONES;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mt-5 break-inside-avoid px-5 py-4", CALLOUT_TONES[tone])}>
      <p className={cn("signage", CALLOUT_LABEL[tone])}>{title}</p>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-brand-blue">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 marker:text-brand-gold">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ManualTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0 print:overflow-visible">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm print:min-w-0">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                scope="col"
                className="signage border-b-2 border-brand-blue py-2.5 pr-4 align-bottom text-brand-blue last:pr-0"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="break-inside-avoid">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "border-b border-border-guest py-3 pr-4 align-top text-slate-700 last:pr-0",
                    j === 0 && "font-semibold text-brand-blue",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A room-status name preceded by its colour chip, for the status tables. */
export function StatusName({ color, name }: { color: string; name: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}

export function Checklist({ area, items }: { area: string; items: string[] }) {
  return (
    <div className="mt-4 break-inside-avoid">
      <h3 className="text-[15px] font-bold text-brand-blue">{area}</h3>
      <ul className="mt-1.5 list-disc space-y-1 pl-6 marker:text-brand-gold">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function QuickRef({
  title = "Quick reference",
  rows,
}: {
  title?: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="mt-10 break-inside-avoid border border-border-guest bg-canvas-ops px-5 py-5 print:mt-8">
      <p className="signage text-brand-blue">{title}</p>
      <table className="mt-3 w-full border-collapse text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="break-inside-avoid">
              <th
                scope="row"
                className="w-[46%] border-b border-border-guest py-2 pr-3 text-left font-normal text-slate-600"
              >
                {r.label}
              </th>
              <td className="border-b border-border-guest py-2 font-bold text-brand-blue">
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

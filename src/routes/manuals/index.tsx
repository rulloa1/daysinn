import { StaffOnly } from "@/components/staff-only";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Presentation, Printer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandLockup } from "@/components/brand-lockup";
import { FranchiseLegal } from "@/components/franchise-footer";

export const Route = createFileRoute("/manuals/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Manuals — Days Inn Guest Hub" },
      {
        name: "description",
        content:
          "Training and operations manuals for the front desk, housekeeping and management at Days Inn Wildwood I-75.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManualsIndex,
});

type DocPath =
  "/manuals/front-desk" | "/manuals/housekeeping" | "/manuals/manager" | "/pitch" | "/collateral";

type Doc = {
  to: DocPath;
  icon: LucideIcon;
  kicker: string;
  title: string;
  blurb: string;
  meta: string;
};

const MANUALS: Doc[] = [
  {
    to: "/manuals/front-desk",
    icon: BookOpen,
    kicker: "Front desk",
    title: "Front Desk Training Manual",
    blurb:
      "Reading the board, selling from live status, working the request queue, and handing over a clean shift.",
    meta: "10 sections · day-one reading is 1–4",
  },
  {
    to: "/manuals/housekeeping",
    icon: BookOpen,
    kicker: "Housekeeping",
    title: "Housekeeping Training Manual",
    blurb:
      "Installing the app, room status words, working a route, the cleaning standard, and what to do with no signal.",
    meta: "10 sections · includes the full room standard",
  },
  {
    to: "/manuals/manager",
    icon: BookOpen,
    kicker: "Management",
    title: "Manager Operations Manual",
    blurb:
      "People and roles, the morning turn plan, the response standard, maintenance dispatch, shifts, and reporting.",
    meta: "11 sections · includes day-one onboarding",
  },
];

const RELATED: Doc[] = [
  {
    to: "/pitch",
    icon: Presentation,
    kicker: "Ownership",
    title: "Guest Hub owner pitch",
    blurb:
      "The thirteen-slide case for the pilot: how the property runs today, what the system changes, and what it makes measurable.",
    meta: "Press → to advance · N toggles speaker notes",
  },
  {
    to: "/collateral",
    icon: Printer,
    kicker: "In-room print",
    title: "Guest room collateral",
    blurb:
      "Table tents, keycard sleeve inserts and desk placards with a live per-room QR code into the request flow.",
    meta: "Three formats · print at 100%, no scaling",
  },
];

function DocCard({ doc }: { doc: Doc }) {
  const Icon = doc.icon;
  return (
    <Link
      to={doc.to}
      className="group flex flex-col rounded-2xl border border-border-guest bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-canvas-ops text-brand-blue">
          <Icon className="h-4 w-4" />
        </span>
        <span className="signage text-brand-gold">{doc.kicker}</span>
      </span>
      <h2 className="mt-4 font-serif text-xl font-bold text-brand-blue">{doc.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{doc.blurb}</p>
      <p className="mt-auto pt-5 text-xs font-semibold text-slate-500">{doc.meta}</p>
      <span className="signage mt-3 text-brand-blue transition group-hover:text-brand-gold">
        Open →
      </span>
    </Link>
  );
}

function ManualsIndexContent() {
  return (
    <div className="min-h-screen bg-canvas-ops text-slate-800">
      <header className="border-b border-border-guest bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <BrandLockup />
          <Link
            to="/staff"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-guest px-3 py-2 text-xs font-semibold text-brand-blue transition hover:bg-canvas-ops"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Staff portal
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pt-12 pb-20 md:px-8">
        <p className="signage text-brand-gold">Days Inn® by Wyndham Wildwood I-75</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight font-bold tracking-tight text-brand-blue">
          Staff manuals
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
          How the property is run on Guest Hub — one manual per role, written to be read on a phone
          at the start of a shift and printed for the back office.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {MANUALS.map((doc) => (
            <DocCard key={doc.to} doc={doc} />
          ))}
        </div>

        <h2 className="signage mt-14 text-slate-500">Also in this set</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {RELATED.map((doc) => (
            <DocCard key={doc.to} doc={doc} />
          ))}
        </div>

        <div className="mt-14 border-t border-border-guest pt-5">
          <p className="text-xs text-slate-500">
            Front desk ·{" "}
            <a href="tel:+13527487766" className="font-semibold">
              (352) 748-7766
            </a>
          </p>
          <div className="mt-2">
            <FranchiseLegal />
          </div>
        </div>
      </main>
    </div>
  );
}

function ManualsIndex() {
  return (
    <StaffOnly title="Staff manuals">
      <ManualsIndexContent />
    </StaffOnly>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { StaffOnly } from "@/components/staff-only";
import { Bullets, Callout, ManualShell, ManualTable, Section } from "@/components/manuals/manual-kit";

export const Route = createFileRoute("/owner-packet")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Guest Hub Owner Packet — Days Inn Wildwood I-75" },
      {
        name: "description",
        content:
          "The owner decision packet for Guest Hub at Days Inn Wildwood I-75: the case, the four-week implementation, pricing, and the questions the owner will ask.",
      },
      { property: "og:title", content: "Guest Hub Owner Packet — Days Inn Wildwood I-75" },
      {
        property: "og:description",
        content:
          "What the property runs on today, what changes, what adoption takes, and what handover includes.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerPacketPage,
});

const COVER = [
  {
    label: "Decision",
    value: "Adopt, not trial",
    note: "A four-week implementation, not a test with a go/no-go at the end.",
  },
  {
    label: "Time from the property",
    value: "About two hours",
    note: "Desk and housekeeping leads, in week one. Everything else fits inside normal shifts.",
  },
  {
    label: "Price",
    value: "$14,500 + $325/mo",
    note: "One-time licence, implementation and handover, then hosting and support.",
  },
  {
    label: "Risk on day one",
    value: "None taken",
    note: "Paper stays on the desk through week three. Nothing is switched off early.",
  },
];

const CONTENTS = [
  "The case — what changes on the property, and what becomes measurable",
  "What adopting it takes — the four weeks, what the property provides, what handover includes",
  "What the owner will ask — answers, and the three decisions needed",
  "Attached: the Operations Handbook, six parts, print-ready",
];

const COMPARE: [string, string][] = [
  [
    "Room status on a printed sheet, re-printed each morning",
    "One live board, sorted so rooms with guests arriving sit at the top",
  ],
  [
    "Housekeeping assignments given verbally and held in the supervisor's head",
    "Each housekeeper's route on their own phone, working offline in the dead spots",
  ],
  [
    "Guest requests arrive by phone and are remembered, not recorded",
    "Requests raised from the room, with a name and a clock against each one",
  ],
  [
    "Repairs reported by radio, then written down if someone remembers",
    "Flagged from inside the room with a photo, dispatched by name",
  ],
  [
    "Handover is a two-minute conversation, if the shifts overlap",
    "Generated from the day's work — what is unfinished and why",
  ],
  [
    "Nothing that happened yesterday can be looked up today",
    "Every room turn, request and repair logged and searchable",
  ],
];

const MEASURES = [
  "Rooms ready by 3:00 PM",
  "Average room turn time",
  "Request response time",
  "Requests per occupied room",
  "Repairs raised and closed",
  "Room-nights lost to blocked rooms",
];

const WEEKS = [
  {
    week: "Week 1",
    title: "Front desk board goes live",
    text: "The desk works the board alongside the paper sheet. The week passes when board and paper agree for three consecutive shifts.",
  },
  {
    week: "Week 2",
    title: "Housekeeping moves to the app",
    text: "Housekeepers set room status themselves. This removes the radio relay and is the week most likely to need repeating.",
  },
  {
    week: "Week 3",
    title: "Guest requests switch on",
    text: "Cards go into the rooms. Response time is the only thing watched.",
  },
  {
    week: "Week 4",
    title: "Paper retired, handover",
    text: "A full week on Guest Hub alone, the first real numbers, and the handover meeting.",
  },
];

const ASKS = [
  "A decision to adopt, and a start date",
  "A named manager who owns the system on property",
  "Desk and housekeeping leads for two hours in week one",
  "Permission to put a printed card in each guest room",
];

const HANDOVER = [
  "Three printed manuals — front desk, housekeeping, manager",
  "Manager admin access: add and remove your own people",
  "Every screen documented for whoever maintains it next",
  "Two weeks of support after go-live, then a named contact",
];

const QA = [
  {
    q: "What does it cost?",
    a: "$14,500 one-time and $325 a month. The one-time figure covers the licence, the four-week implementation, training, printed manuals and handover — the software is already built, so none of it is speculative development. The monthly covers hosting, data and support.",
  },
  {
    q: "What happens when the Wi-Fi goes down?",
    a: "Phones keep the full route and keep recording; changes send when signal returns, and staff cannot clock out with work still queued. For a wider outage the board prints and the property runs on paper, exactly as it does now.",
  },
  {
    q: "Does this replace the system we pay for today?",
    a: "It takes over the operational half — the board, housekeeping, requests, reports. Reservations, rates and payment stay where they are. Replacing more than that is a separate decision.",
  },
  {
    q: "Will the staff actually use it?",
    a: "Housekeepers sign on by tapping their name — no email, no password, three taps per room. It replaces work rather than adding it. Week two is the honest test, and it can repeat if it does not land.",
  },
  {
    q: "What if it does not work out?",
    a: "Paper stays on the desk through week three, so there is nothing to unwind before then. After that, the room list and every request can be printed at any time. No contract to exit.",
  },
  {
    q: "Is that good value against buying something off the shelf?",
    a: "Per-room housekeeping and ops software runs about $5 per room per month — roughly $540 a month here, near $6,500 a year, indefinitely, with no ownership at the end. This is $325 a month, and the property owns the licence outright after the one-time fee.",
  },
];

const DECISIONS = [
  {
    name: "Adopt, and a start date",
    note: "Week one begins on a Monday. The four weeks should sit in the shoulder season, not a peak week.",
  },
  {
    name: "The manager who owns it",
    note: "One named person with admin access. Consider a second manager account so a lockout on a Saturday has a fix.",
  },
  {
    name: "Terms and start of billing",
    note: "Whether the one-time fee is paid on signature or split across the four weeks, and the month the $325 begins.",
  },
];

function OwnerPacketContent() {
  return (
    <ManualShell
      runningHead="Owner packet"
      title="Guest Hub Owner Packet"
      intro="Everything needed to take this decision to the owner: what the property runs on today, what changes, what it takes to adopt, and the answers to the questions that will come back."
    >
      <Callout tone="gold" title="The ask, in one sentence">
        <p className="text-[17px] leading-snug font-semibold text-brand-blue">
          Adopt Guest Hub at Wildwood I-75, starting a four-week implementation that ends with the
          property owning it outright.
        </p>
      </Callout>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {COVER.map((c) => (
          <div key={c.label} className="break-inside-avoid border border-border-guest bg-canvas-ops px-4 py-3.5">
            <p className="signage text-slate-500">{c.label}</p>
            <p className="mt-1.5 text-[15px] leading-snug font-bold text-brand-blue">{c.value}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 break-inside-avoid border border-border-guest px-5 py-4">
        <p className="signage text-brand-blue">What is in this packet</p>
        <ol className="mt-2">
          {CONTENTS.map((t, i) => (
            <li key={t} className="flex gap-4 border-b border-border-guest py-2 last:border-b-0">
              <span className="w-6 shrink-0 text-sm font-bold text-slate-400 tabular-nums">
                {i + 1}
              </span>
              <span className="text-[15px] leading-relaxed text-slate-700">{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <Section n={1} title="The case — what changes on the property">
        <ManualTable
          columns={["Today", "With Guest Hub"]}
          rows={COMPARE.map(([now, next]) => [
            <span className="font-semibold text-[#8A5A12]">{now}</span>,
            next,
          ])}
        />

        <Callout tone="gold" title="Say this to the owner">
          <p>
            The property is not badly run. It is run on memory and paper, which works right up until
            the day it doesn't — an arrival at 4 PM with no clean room, a repair nobody logged, a
            complaint nobody can trace. Guest Hub does not add work. It replaces the phone calls and
            the clipboard with a record, and the record is what makes the rest measurable.
          </p>
        </Callout>

        <p className="signage pt-2 text-brand-gold">What becomes measurable</p>
        <p>
          None of these figures exist at the property today. Producing them is the first thing the
          system does — and the reason to be careful with anyone who promises a percentage
          improvement before there is a baseline.
        </p>
        <Bullets items={MEASURES} />

        <p className="border-t border-border-guest pt-3 text-sm text-slate-500">
          Guest Hub does not take bookings, hold card details, or replace anything Wyndham requires.
          Reservations, rates and Wyndham Rewards stay exactly where they are.
        </p>
      </Section>

      <Section n={2} title="What adopting it takes — four weeks, then it is yours">
        <div className="space-y-2.5">
          {WEEKS.map((w) => (
            <div
              key={w.week}
              className="flex break-inside-avoid flex-col gap-1 border border-border-guest bg-canvas-ops px-4 py-3 sm:flex-row sm:gap-4"
            >
              <span className="signage shrink-0 pt-0.5 text-[#8A6D1F] sm:w-24">{w.week}</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-brand-blue">{w.title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-slate-700">
                  {w.text}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-4 pt-2 md:grid-cols-2">
          <div className="break-inside-avoid border border-border-guest px-5 py-4">
            <p className="signage text-brand-blue">What the property provides</p>
            <div className="mt-2">
              <Bullets items={ASKS} />
            </div>
          </div>
          <div className="break-inside-avoid border border-border-guest border-l-4 border-l-brand-gold bg-[#F7F5EE] px-5 py-4">
            <p className="signage text-[#8A6D1F]">What you get at handover</p>
            <div className="mt-2">
              <Bullets items={HANDOVER} />
            </div>
          </div>
        </div>

        <div className="mt-2 break-inside-avoid border border-border-guest bg-canvas-ops px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="signage text-brand-blue">Price</p>
            <p className="text-sm text-slate-500">
              Comparable per-room software: about $540 a month, with no ownership
            </p>
          </div>
          <div className="mt-3 grid gap-5 md:grid-cols-2">
            <div className="md:border-r md:border-border-guest md:pr-5">
              <p className="font-serif text-3xl font-bold text-brand-blue">$14,500</p>
              <p className="signage mt-1 text-[#8A6D1F]">One time</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">
                Licence, the four-week implementation, training, printed manuals and handover. The
                software is built — none of this is speculative development.
              </p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-brand-blue">
                $325<span className="text-base font-semibold text-slate-600"> / month</span>
              </p>
              <p className="signage mt-1 text-[#8A6D1F]">Ongoing</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">
                Hosting, data and support. No per-room fee, no per-user fee, and no charge for
                adding staff accounts.
              </p>
            </div>
          </div>
        </div>

        <Callout tone="amber" title="No single point of failure">
          <p>
            The handover is written into week four rather than left to goodwill: printed manuals for
            every role, manager admin access so the property adds and removes its own people, and
            full documentation for whoever maintains the system next. The owner should ask what
            happens if the person who built it is unavailable — the honest answer is that the
            property runs it, and the documentation is the reason that is true.
          </p>
        </Callout>
      </Section>

      <Section n={3} title="What the owner will ask">
        <div className="space-y-4">
          {QA.map((item) => (
            <div key={item.q} className="break-inside-avoid">
              <p className="text-[15px] font-bold text-brand-blue">{item.q}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-2 break-inside-avoid border border-border-guest px-5 py-4">
          <p className="signage text-brand-blue">The three decisions</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
            Three things need an answer before week one can be scheduled. Nothing else is blocking.
          </p>
          <div className="mt-3 space-y-2.5">
            {DECISIONS.map((d) => (
              <div key={d.name} className="flex items-start gap-3">
                <span aria-hidden className="mt-1 h-4 w-4 shrink-0 border-[1.5px] border-slate-400" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold text-brand-blue">{d.name}</span>
                  <span className="block text-sm leading-relaxed text-slate-700">{d.note}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-6 border-t border-border-guest pt-4 sm:grid-cols-2">
            <div>
              <div className="h-7 border-b border-slate-400" />
              <p className="signage mt-1.5 text-slate-500">Owner · signature and date</p>
            </div>
            <div>
              <div className="h-7 border-b border-slate-400" />
              <p className="signage mt-1.5 text-slate-500">Manager who will own it</p>
            </div>
          </div>
        </div>
      </Section>
    </ManualShell>
  );
}

function OwnerPacketPage() {
  return (
    <StaffOnly title="Owner packet">
      <OwnerPacketContent />
    </StaffOnly>
  );
}

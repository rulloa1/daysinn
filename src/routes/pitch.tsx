import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Printer, StickyNote } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pitch")({
  head: () => ({
    meta: [
      { title: "Guest Hub — Operations Proposal — Days Inn Wildwood I-75" },
      {
        name: "description",
        content:
          "The case for a two-week Guest Hub pilot: how the property runs today, what one shared room record changes, and what it makes measurable.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PitchDeck,
});

/* Type scale, expressed against the slide's own width so the deck stays
   proportional at any viewport. 1920px reference → 1cqw = 19.2px. */
const T = {
  huge: "text-[7.8cqw]",
  big: "text-[5cqw]",
  cover: "text-[6.25cqw]",
  title: "text-[3.33cqw]",
  subtitle: "text-[2.3cqw]",
  body: "text-[1.77cqw]",
  small: "text-[1.46cqw]",
  label: "text-[1.25cqw]",
} as const;

const PAD = "p-[5.2cqw]";
const KICKER = `${T.label} font-bold uppercase tracking-[0.22em]`;

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className={cn("flex items-start gap-[1.25cqw]", T.small, "leading-snug text-slate-700")}>
      <span
        aria-hidden
        className="mt-[0.75cqw] h-[0.52cqw] w-[0.52cqw] shrink-0 rounded-full bg-brand-gold"
      />
      <span>{children}</span>
    </li>
  );
}

function LiveScreen({
  to,
  label,
  caption,
}: {
  to: "/front-desk" | "/housekeeping" | "/staff";
  label: string;
  caption: string;
}) {
  return (
    <div className="flex h-full flex-col justify-center rounded-[1.25cqw] bg-canvas-ops p-[2.6cqw]">
      <span className={cn(KICKER, "text-slate-400")}>Live screen</span>
      <p className={cn("mt-[1.4cqw] font-serif font-bold text-brand-blue", T.subtitle)}>{label}</p>
      <p className={cn("mt-[1.2cqw] leading-snug text-slate-600", T.small)}>{caption}</p>
      <Link
        to={to}
        className={cn(
          "mt-[2cqw] inline-flex w-fit items-center rounded-[0.6cqw] bg-brand-blue px-[1.8cqw] py-[1cqw] font-bold text-white transition hover:opacity-90 print:hidden",
          T.small,
        )}
      >
        Open {to} →
      </Link>
    </div>
  );
}

type Slide = { label: string; notes: string; render: () => ReactNode };

const ROOM_TILES: [string, string][] = [
  ["108", "#E08A2E"],
  ["109", "#34D399"],
  ["110", "#B98BE8"],
  ["111", "#5AA9E6"],
  ["112", "#34D399"],
  ["113", "#E08A2E"],
  ["114", "#4ECBD9"],
  ["115", "#5AA9E6"],
  ["116", "#F0705F"],
  ["117", "#34D399"],
  ["200", "#5AA9E6"],
  ["201", "#34D399"],
  ["202", "#E08A2E"],
  ["203", "#5AA9E6"],
  ["204", "#5AA9E6"],
  ["205", "#E08A2E"],
  ["206", "#34D399"],
  ["207", "#4ECBD9"],
  ["208", "#5AA9E6"],
  ["209", "#B98BE8"],
];

const LEGEND: [string, string][] = [
  ["Ready 12", "#34D399"],
  ["To turn 9", "#E08A2E"],
  ["In house 28", "#5AA9E6"],
  ["Arriving 5", "#4ECBD9"],
  ["Blocked 1", "#F0705F"],
];

const MEASURES: [string, string, string][] = [
  ["Room turnover time", "Not recorded", "Per room, per housekeeper, per day"],
  ["Guest request response", "Not recorded", "Average time to first action, and breaches"],
  ["Rooms ready to sell", "Asked over the radio", "Live count, always on screen"],
  ["Maintenance backlog", "In the manager's head", "A dated list with an owner on each item"],
  ["Staff workload", "By feel", "Rooms completed per person, per shift"],
];

const ROLLOUT: [string, string, string][] = [
  [
    "Week 1",
    "Load the property",
    "All 58 rooms, buildings, floors and wings entered. Staff accounts created.",
  ],
  [
    "Week 2",
    "Housekeeping first",
    "One floor, one shift, phones only. Paper sheets stay as backup.",
  ],
  ["Week 3", "Front desk board", "Monitor behind the desk. Radios stay on, used less each day."],
  [
    "Week 4",
    "Guest requests on",
    "QR codes in the rooms. First full week of measured response times.",
  ],
];

const ASKS: [string, string, string][] = [
  ["1", "A two-week pilot", "One floor of housekeeping and one shift at the desk. Stop any time."],
  [
    "2",
    "Your manager's time",
    "About two hours in week one to load rooms and set up staff accounts.",
  ],
  [
    "3",
    "A monitor at the desk",
    "The room board is meant to be always visible behind the front desk.",
  ],
];

const SLIDES: Slide[] = [
  {
    label: "Cover",
    notes:
      "Thanks for the time. I want to walk you through a system we've built for the property — how the desk, housekeeping and guests all work off the same information — and ask for a two-week pilot at the end.",
    render: () => (
      <div className={cn("flex h-full flex-col justify-center bg-brand-blue text-white", PAD)}>
        <span className="mb-[3.3cqw] inline-flex w-fit rounded-[0.6cqw] bg-white px-[1cqw] py-[0.7cqw]">
          <img src={logoAsset.url} alt="Days Inn" className="h-[2.9cqw] w-auto" />
        </span>
        <p className={cn(KICKER, "text-brand-gold")}>Wildwood I-75 · Operations proposal</p>
        <h1 className={cn("mt-[1.25cqw] font-serif font-bold", T.cover)}>Guest Hub</h1>
        <p className={cn("mt-[1.9cqw] max-w-[57cqw] leading-snug text-white/80", T.subtitle)}>
          One system for the front desk, housekeeping and the guest in the room.
        </p>
        <p className={cn("mt-auto text-white/55", T.small)}>
          Prepared for the property owner · August 2026
        </p>
      </div>
    ),
  },
  {
    label: "Today",
    notes:
      "Start with what he already knows is true. Don't oversell the pain — he lives it. The point is that none of this is written down anywhere he can see.",
    render: () => (
      <div className={cn("flex h-full flex-col bg-canvas-ops text-slate-800", PAD)}>
        <p className={cn(KICKER, "text-slate-400")}>The starting point</p>
        <h2 className={cn("mt-[1cqw] font-serif font-bold text-brand-blue", T.title)}>
          How the property runs today
        </h2>
        <div className="mt-[2.7cqw] grid grid-cols-3 gap-[2cqw]">
          {[
            [
              "Room status",
              "Lives on a clipboard and in radio traffic. The desk asks; housekeeping answers when they can.",
            ],
            [
              "Guest requests",
              "Arrive by phone call or in person, get written on a pad, and are only as reliable as the shift change.",
            ],
            [
              "Your visibility",
              "Whatever the manager reports at the end of the day. Nothing you can check yourself.",
            ],
          ].map(([h, b]) => (
            <div key={h} className="rounded-[1cqw] border border-slate-200 bg-white p-[2.2cqw]">
              <p className={cn(T.label, "font-bold tracking-[0.16em] text-brand-gold uppercase")}>
                {h}
              </p>
              <p className={cn("mt-[1cqw] leading-snug text-slate-700", T.body)}>{b}</p>
            </div>
          ))}
        </div>
        <p className={cn("mt-auto leading-snug text-slate-600", T.body)}>
          None of this is a staffing problem. It is a record-keeping problem, and software fixes
          record-keeping.
        </p>
      </div>
    ),
  },
  {
    label: "Three roles",
    notes:
      "This is the architecture slide. Everyone reads and writes to the same room record — that single idea is what makes the rest of the deck work.",
    render: () => (
      <div className={cn("flex h-full flex-col bg-white text-slate-800", PAD)}>
        <p className={cn(KICKER, "text-slate-400")}>What we built</p>
        <h2 className={cn("mt-[1cqw] font-serif font-bold text-brand-blue", T.title)}>
          One system, three roles
        </h2>
        <div className="mt-[2.7cqw] grid grid-cols-3 gap-[1.9cqw]">
          {[
            [
              "The guest",
              "Asks from the room",
              "Towels, maintenance, late checkout — from their phone, no call to the desk.",
            ],
            [
              "The front desk",
              "Sees every room",
              "Status, arrivals, open requests and who is working which floor, on one board.",
            ],
            [
              "Housekeeping",
              "Works a route",
              "Next room on a phone, one tap to mark it clean, no radio call needed.",
            ],
          ].map(([k, h, b]) => (
            <div key={k} className="rounded-[1cqw] bg-brand-blue p-[2.2cqw] text-white">
              <p className={cn(T.label, "font-bold tracking-[0.16em] text-brand-gold uppercase")}>
                {k}
              </p>
              <p className={cn("mt-[1cqw] font-semibold", T.subtitle)}>{h}</p>
              <p className={cn("mt-[1.25cqw] leading-snug text-white/80", T.small)}>{b}</p>
            </div>
          ))}
        </div>
        <p className={cn("mt-auto leading-snug text-slate-600", T.body)}>
          All three read and write the same room record. When housekeeping marks 114 clean, the desk
          can sell it that second.
        </p>
      </div>
    ),
  },
  {
    label: "Guest requests",
    notes:
      "Two things to land: fewer calls to the desk, and every request is now timestamped and attributable. That second part is what makes the service standard enforceable.",
    render: () => (
      <div
        className={cn(
          "grid h-full grid-cols-[1.1fr_1fr] items-center gap-[4cqw] bg-canvas-ops text-slate-800",
          PAD,
        )}
      >
        <div>
          <p className={cn(KICKER, "text-slate-400")}>Guest side</p>
          <h2 className={cn("mt-[1cqw] mb-[2cqw] font-serif font-bold text-brand-blue", T.title)}>
            Guest requests from the room
          </h2>
          <ul className="flex flex-col gap-[1.4cqw]">
            <Bullet>A QR code in the room opens the request page — no app to download.</Bullet>
            <Bullet>Towels, housekeeping, maintenance, front desk help, late checkout.</Bullet>
            <Bullet>Every request is timestamped, attributed and tracked to resolution.</Bullet>
            <Bullet>The guest sees it was received, so they stop calling to check.</Bullet>
          </ul>
        </div>
        <div className="rounded-[1.25cqw] bg-brand-blue p-[2.8cqw] text-white">
          <p className={cn(T.label, "font-bold tracking-[0.16em] text-brand-gold uppercase")}>
            What the desk receives
          </p>
          <p className={cn("mt-[1.5cqw] font-semibold tabular-nums", T.big)}>214</p>
          <p className={cn("mt-[1cqw] font-semibold", T.subtitle)}>Fresh towels &amp; linens</p>
          <p className={cn("mt-[1cqw] leading-snug text-white/80", T.small)}>
            “Two bath towels and an extra pillow, please.”
          </p>
          <p
            className={cn(
              "mt-[1.7cqw] border-t border-white/20 pt-[1.5cqw] text-white/60",
              T.small,
            )}
          >
            Whitfield · opened 2:41 PM · unassigned
          </p>
        </div>
      </div>
    ),
  },
  {
    label: "Front desk board",
    notes:
      "Point at the blue panel first. The board doesn't just show data, it tells the shift lead what to do next — three arrivals coming, two rooms not ready. That is the difference from a spreadsheet.",
    render: () => (
      <div
        className={cn("grid h-full grid-cols-[1fr_1.25fr] items-center gap-[3.3cqw] bg-white", PAD)}
      >
        <div>
          <p className={cn(KICKER, "text-slate-400")}>Front desk</p>
          <h2 className={cn("mt-[1cqw] font-serif font-bold text-brand-blue", T.title)}>
            The front desk board
          </h2>
          <p className={cn("mt-[1.9cqw] mb-[1.9cqw] leading-snug text-slate-600", T.body)}>
            The shift lead opens one screen and knows what needs them right now.
          </p>
          <ul className="flex flex-col gap-[1.4cqw]">
            <Bullet>Arrivals at risk are named, not buried in a list.</Bullet>
            <Bullet>All 58 rooms sorted by urgency, not room number.</Bullet>
            <Bullet>Occupancy, rooms ready to sell and turnover time, live.</Bullet>
          </ul>
        </div>
        <LiveScreen
          to="/front-desk"
          label="Front desk board"
          caption="The real board, running on this property's data — not a screenshot."
        />
      </div>
    ),
  },
  {
    label: "Housekeeping",
    notes:
      "The phone view is the piece that changes staff behaviour. One room, one big button. No training required, and it works for staff who don't read English comfortably because the room number and the colour carry the meaning.",
    render: () => (
      <div
        className={cn(
          "grid h-full grid-cols-[1.25fr_1fr] items-center gap-[3.3cqw] bg-canvas-ops",
          PAD,
        )}
      >
        <LiveScreen
          to="/housekeeping"
          label="Housekeeping phone view"
          caption="One room at a time, in the order the desk needs it. Open it on a phone to see the real thing."
        />
        <div>
          <p className={cn(KICKER, "text-slate-400")}>Housekeeping</p>
          <h2 className={cn("mt-[1cqw] font-serif font-bold text-brand-blue", T.title)}>
            Housekeeping on a phone
          </h2>
          <p className={cn("mt-[1.9cqw] mb-[1.9cqw] leading-snug text-slate-600", T.body)}>
            One room at a time, in the order the desk needs it.
          </p>
          <ul className="flex flex-col gap-[1.4cqw]">
            <Bullet>The next room is chosen by arrival time, not the order on a sheet.</Bullet>
            <Bullet>One tap marks a room clean and releases it to the desk.</Bullet>
            <Bullet>Maintenance issues get flagged from the room, with the room attached.</Bullet>
            <Bullet>A supervisor view rebalances the day across the team.</Bullet>
          </ul>
        </div>
      </div>
    ),
  },
  {
    label: "Request queue",
    notes:
      "This slide is about accountability. Every request has a clock on it, and the ones that break the standard are flagged before the guest complains — not after they leave a review.",
    render: () => (
      <div
        className={cn("grid h-full grid-cols-[1fr_1.25fr] items-center gap-[3.3cqw] bg-white", PAD)}
      >
        <div>
          <p className={cn(KICKER, "text-slate-400")}>Service standards</p>
          <h2 className={cn("mt-[1cqw] font-serif font-bold text-brand-blue", T.title)}>
            The request queue
          </h2>
          <p className={cn("mt-[1.9cqw] mb-[1.9cqw] leading-snug text-slate-600", T.body)}>
            Every guest request carries a clock and an owner.
          </p>
          <ul className="flex flex-col gap-[1.4cqw]">
            <Bullet>Requests past the response standard are flagged in red.</Bullet>
            <Bullet>Who opened it, who took it, when it closed — kept on the record.</Bullet>
            <Bullet>Nothing is lost at shift change, because nothing lives on paper.</Bullet>
          </ul>
        </div>
        <LiveScreen
          to="/staff"
          label="Request queue"
          caption="New, in progress and done — with the acknowledgement clock running on each one."
        />
      </div>
    ),
  },
  {
    label: "Room status",
    notes:
      "Colour is the whole interface here. Anyone can read this board from across the lobby — that's deliberate, because it will live on a monitor behind the desk.",
    render: () => (
      <div className={cn("flex h-full flex-col bg-brand-blue text-white", PAD)}>
        <p className={cn(KICKER, "text-brand-gold")}>Property view</p>
        <h2 className={cn("mt-[1cqw] font-serif font-bold", T.title)}>Live room status</h2>
        <div className="mt-[2.4cqw] mb-[2.4cqw] flex gap-[2.9cqw]">
          {LEGEND.map(([label, color]) => (
            <span
              key={label}
              className={cn("flex items-center gap-[0.8cqw] text-white/85", T.small)}
            >
              <span
                aria-hidden
                className="h-[1cqw] w-[1cqw] rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-10 gap-[0.8cqw]">
          {ROOM_TILES.map(([num, color]) => (
            <div
              key={num}
              className="bg-white/8 px-[1cqw] py-[1.25cqw]"
              style={{ borderTop: `0.3cqw solid ${color}` }}
            >
              <p className="text-[2.3cqw] font-semibold tabular-nums">{num}</p>
            </div>
          ))}
        </div>
        <p className={cn("mt-auto max-w-[73cqw] leading-snug text-white/75", T.body)}>
          Grouped by building and floor, updating as housekeeping works. Intended for a monitor
          behind the desk.
        </p>
      </div>
    ),
  },
  {
    label: "Ops Assistant",
    notes:
      "Keep this short. It's a nice-to-have, not the pitch. The useful framing: the manager can ask a question instead of learning where a screen lives.",
    render: () => (
      <div className={cn("flex h-full flex-col justify-center bg-canvas-ops text-slate-800", PAD)}>
        <p className={cn(KICKER, "text-slate-400")}>Built in</p>
        <h2 className={cn("mt-[1cqw] mb-[2.9cqw] font-serif font-bold text-brand-blue", T.title)}>
          Ops Assistant
        </h2>
        <div className="flex max-w-[78cqw] flex-col gap-[1.25cqw]">
          {[
            "“Which rooms on floor 2 still need turning?”",
            "“Mark 214 clean.”",
            "“Give me the property summary.”",
          ].map((q) => (
            <div
              key={q}
              className={cn(
                "rounded-[1cqw] border border-slate-200 bg-white px-[2cqw] py-[1.8cqw] leading-snug text-slate-700",
                T.subtitle,
              )}
            >
              {q}
            </div>
          ))}
        </div>
        <p className={cn("mt-[2.9cqw] leading-snug text-slate-600", T.body)}>
          A manager can ask a question in plain English instead of learning where every screen
          lives.
        </p>
      </div>
    ),
  },
  {
    label: "Measurement",
    notes:
      "Be honest here: I'm not promising savings numbers. I'm promising that these numbers will exist. Right now none of them do, so we can't manage against them.",
    render: () => (
      <div className={cn("flex h-full flex-col bg-white text-slate-800", PAD)}>
        <p className={cn(KICKER, "text-slate-400")}>For you</p>
        <h2 className={cn("mt-[1cqw] mb-[2.7cqw] font-serif font-bold text-brand-blue", T.title)}>
          What management can measure
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Measure", "Today", "With Guest Hub"].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "border-b-2 border-slate-200 pb-[1.25cqw] text-left font-bold tracking-[0.16em] text-slate-400 uppercase",
                    T.label,
                    i > 0 && "pl-[2.5cqw]",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEASURES.map(([m, today, hub]) => (
              <tr key={m}>
                <td
                  className={cn(
                    "border-b border-slate-100 py-[1.7cqw] font-semibold text-brand-blue",
                    T.body,
                  )}
                >
                  {m}
                </td>
                <td
                  className={cn(
                    "border-b border-slate-100 py-[1.7cqw] pl-[2.5cqw] text-slate-400",
                    T.small,
                  )}
                >
                  {today}
                </td>
                <td
                  className={cn(
                    "border-b border-slate-100 py-[1.7cqw] pl-[2.5cqw] text-slate-700",
                    T.small,
                  )}
                >
                  {hub}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    label: "Rollout",
    notes:
      "The message: this is not a construction project. No new hardware beyond what staff already carry, and we can stop after two weeks if it isn't working.",
    render: () => (
      <div className={cn("flex h-full flex-col bg-canvas-ops text-slate-800", PAD)}>
        <p className={cn(KICKER, "text-slate-400")}>Getting there</p>
        <h2 className={cn("mt-[1cqw] mb-[2.7cqw] font-serif font-bold text-brand-blue", T.title)}>
          Rollout in four weeks
        </h2>
        <div className="grid grid-cols-4 gap-[1.7cqw]">
          {ROLLOUT.map(([week, head, body], i) => {
            const last = i === ROLLOUT.length - 1;
            return (
              <div
                key={week}
                className={cn(
                  "rounded-[1cqw] border-t-[0.42cqw] border-t-brand-gold p-[2cqw]",
                  last
                    ? "bg-brand-blue text-white"
                    : "border-x border-b border-x-slate-200 border-b-slate-200 bg-white",
                )}
              >
                <p
                  className={cn(
                    T.label,
                    "font-bold tracking-[0.16em] uppercase",
                    last ? "text-brand-gold" : "text-slate-400",
                  )}
                >
                  {week}
                </p>
                <p
                  className={cn(
                    "mt-[1cqw] font-semibold",
                    T.subtitle,
                    last ? "text-white" : "text-brand-blue",
                  )}
                >
                  {head}
                </p>
                <p
                  className={cn(
                    "mt-[1cqw] leading-snug",
                    T.small,
                    last ? "text-white/80" : "text-slate-600",
                  )}
                >
                  {body}
                </p>
              </div>
            );
          })}
        </div>
        <p className={cn("mt-auto leading-snug text-slate-600", T.body)}>
          No new hardware. Staff use the phones they already carry; the desk uses the computer
          already there.
        </p>
      </div>
    ),
  },
  {
    label: "The ask",
    notes:
      "Three concrete asks. Keep it to these — don't add a budget conversation here unless he raises it.",
    render: () => (
      <div className={cn("flex h-full flex-col bg-white text-slate-800", PAD)}>
        <p className={cn(KICKER, "text-slate-400")}>The ask</p>
        <h2 className={cn("mt-[1cqw] mb-[2.7cqw] font-serif font-bold text-brand-blue", T.title)}>
          What we need from you
        </h2>
        <div className="grid grid-cols-3 gap-[2cqw]">
          {ASKS.map(([n, head, body]) => (
            <div key={n} className="border-l-[0.42cqw] border-brand-gold py-[0.4cqw] pl-[2cqw]">
              <p
                className={cn("font-semibold text-brand-blue tabular-nums", T.huge, "leading-none")}
              >
                {n}
              </p>
              <p className={cn("mt-[1.25cqw] font-semibold text-brand-blue", T.subtitle)}>{head}</p>
              <p className={cn("mt-[1cqw] leading-snug text-slate-600", T.small)}>{body}</p>
            </div>
          ))}
        </div>
        <p className={cn("mt-auto leading-snug text-slate-600", T.body)}>
          Everything else is already built and running.
        </p>
      </div>
    ),
  },
  {
    label: "Next step",
    notes:
      "Close on the pilot, not on the software. Ask directly: can we start Monday on floor one?",
    render: () => (
      <div className={cn("flex h-full flex-col justify-center bg-brand-blue text-white", PAD)}>
        <p className={cn(KICKER, "mb-[1.7cqw] text-brand-gold")}>Next step</p>
        <h2 className={cn("max-w-[78cqw] font-serif leading-tight font-bold", T.big)}>
          Two weeks on floor one, starting Monday
        </h2>
        <p className={cn("mt-[2.5cqw] max-w-[62cqw] leading-snug text-white/80", T.subtitle)}>
          We keep the paper sheets running alongside. If it hasn't earned its place by the end of
          the second week, we stop.
        </p>
        <span className="mt-auto inline-flex w-fit rounded-[0.6cqw] bg-white px-[1cqw] py-[0.7cqw]">
          <img src={logoAsset.url} alt="Days Inn" className="h-[2.5cqw] w-auto" />
        </span>
      </div>
    ),
  },
];

function PitchDeck() {
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const go = useCallback((delta: number) => {
    setIndex((i) => Math.min(SLIDES.length - 1, Math.max(0, i + delta)));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === "Home") setIndex(0);
      else if (e.key === "End") setIndex(SLIDES.length - 1);
      else if (e.key.toLowerCase() === "n") setShowNotes((v) => !v);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const current: Slide | undefined = SLIDES[index];

  return (
    <div className="min-h-screen bg-brand-deep text-white print:bg-white">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 md:px-8 print:hidden">
        <Link to="/manuals" className="signage text-white/60 transition hover:text-white">
          ← Manuals
        </Link>
        <span className="signage text-brand-gold">Guest Hub · Operations proposal</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition",
              showNotes
                ? "border-brand-gold bg-brand-gold text-brand-blue"
                : "border-white/25 text-white/75 hover:bg-white/10",
            )}
            aria-pressed={showNotes}
          >
            <StickyNote className="h-3.5 w-3.5" />
            Notes
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-5 pb-10 md:px-8 print:max-w-none print:px-0">
        {SLIDES.map((slide, i) => (
          <section
            key={slide.label}
            aria-label={slide.label}
            aria-hidden={i !== index}
            className={cn(
              "@container aspect-[16/9] w-full overflow-hidden rounded-xl shadow-2xl print:mb-4 print:block print:rounded-none print:shadow-none",
              i === index ? "block" : "hidden",
            )}
          >
            {slide.render()}
          </section>
        ))}

        <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="inline-flex items-center gap-1 rounded-md border border-white/25 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === SLIDES.length - 1}
            className="inline-flex items-center gap-1 rounded-md bg-brand-gold px-3 py-2 text-sm font-semibold text-brand-blue transition hover:opacity-90 disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="text-sm text-white/60 tabular-nums">
            {index + 1} / {SLIDES.length} · {current?.label}
          </p>
          <p className="ml-auto hidden text-xs text-white/40 sm:block">
            ← → to move · N for speaker notes
          </p>
        </div>

        {showNotes ? (
          <div className="mt-4 rounded-lg border border-white/15 bg-white/5 p-4 print:hidden">
            <p className="signage text-brand-gold">Speaker notes · {current?.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{current?.notes}</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

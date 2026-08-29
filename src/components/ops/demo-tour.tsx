import { useEffect, useRef, useState } from "react";
import type { DashboardTab } from "@/components/staff/types";

type Step = {
  tab: DashboardTab;
  title: string;
  caption: string;
};

const SCRIPT: Step[] = [
  {
    tab: "queue",
    title: "Guest requests land here",
    caption:
      "Front desk sees every new ask the moment a guest sends it, oldest-first, with the room attached.",
  },
  {
    tab: "map",
    title: "Live property map",
    caption:
      "Room status updates in real time — ready, occupied, vacant dirty — across both floors of the property.",
  },
  {
    tab: "maintenance",
    title: "Maintenance tickets",
    caption: "Anything broken becomes a tracked ticket instead of a note behind the desk.",
  },
  {
    tab: "crm",
    title: "Guest history",
    caption: "Repeat guests, preferences, and past stays stay attached to the guest profile.",
  },
  {
    tab: "assignments",
    title: "Housekeeping assignments",
    caption: "Managers hand each housekeeper their board — nobody sees another person's rooms.",
  },
  {
    tab: "schedules",
    title: "Shift schedule",
    caption: "Rooms are assigned per housekeeper for specific dates and shift times.",
  },
  {
    tab: "analytics",
    title: "Owner metrics",
    caption: "Turn times, request volume, and occupancy roll up for the owner packet.",
  },
  {
    tab: "team",
    title: "Team and roles",
    caption: "Invite staff, set roles, and revoke access from one manager-only screen.",
  },
];

const PACE = { slow: 12000, easy: 8000 } as const;

export function DemoTour({
  onGoTo,
  canViewTab,
}: {
  onGoTo: (tab: DashboardTab) => void;
  canViewTab: (tab: DashboardTab) => boolean;
}) {
  const [running, setRunning] = useState(false);
  const [pace, setPace] = useState<keyof typeof PACE>("slow");
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const goTo = useRef(onGoTo);
  goTo.current = onGoTo;

  const steps = SCRIPT.filter((s) => canViewTab(s.tab));
  const step = steps[Math.min(index, Math.max(steps.length - 1, 0))];
  const duration = PACE[pace];

  useEffect(() => {
    if (!running || !step) return;
    goTo.current(step.tab);
    setElapsed(0);
    const started = Date.now();
    const tick = window.setInterval(() => setElapsed(Date.now() - started), 120);
    const next = window.setTimeout(() => setIndex((i) => (i + 1) % steps.length), duration);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(next);
    };
  }, [running, index, duration, step?.tab, steps.length]);

  if (steps.length === 0) return null;

  if (!running) {
    return (
      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setRunning(true);
        }}
        className="fixed right-5 bottom-5 z-50 rounded-full bg-[#004986] px-5 py-3 text-xs font-bold tracking-wide text-white shadow-lg shadow-slate-900/20 hover:bg-[#004986]/90"
      >
        ▶ Auto-demo the portal
      </button>
    );
  }

  const progress = Math.min(100, (elapsed / duration) * 100);

  return (
    <div className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-[#C7D5E4] bg-white/95 p-4 shadow-xl shadow-slate-900/20 backdrop-blur md:inset-x-auto md:right-6 md:bottom-6 md:w-[30rem]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#B45309] uppercase">
            Guided demo · step {Math.min(index, steps.length - 1) + 1} of {steps.length}
          </p>
          <p className="mt-1 text-sm font-bold text-[#00294c]">{step?.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{step?.caption}</p>
        </div>
        <button
          type="button"
          onClick={() => setRunning(false)}
          className="shrink-0 rounded-lg border border-[#C7D5E4] px-2 py-1 text-[11px] font-bold text-[#004986]"
        >
          Stop
        </button>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#E2EAF3]">
        <div
          className="h-full bg-[#004986] transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + steps.length) % steps.length)}
          className="min-h-9 rounded-lg border border-[#C7D5E4] px-3 text-[11px] font-bold text-[#004986]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % steps.length)}
          className="min-h-9 rounded-lg border border-[#C7D5E4] px-3 text-[11px] font-bold text-[#004986]"
        >
          Next
        </button>
        <div className="ml-auto flex items-center gap-1">
          {(["slow", "easy"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPace(p)}
              aria-pressed={pace === p}
              className={`min-h-9 rounded-lg border px-3 text-[11px] font-bold ${
                pace === p
                  ? "border-[#004986] bg-[#004986] text-white"
                  : "border-[#C7D5E4] bg-white text-[#004986]"
              }`}
            >
              {p === "slow" ? "Slow (12s)" : "Normal (8s)"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

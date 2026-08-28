import { useState, useMemo } from "react";
import { Sparkles, Send, Bot, User, CheckCircle2, Clock, Wrench } from "lucide-react";
import { timeAgo, type StaffIdentity } from "@/lib/ops";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { askOpsAssistant } from "@/lib/ops-assistant.functions";
import type { RequestRow } from "./types";

interface RequestQueueProps {
  visible: RequestRow[];
  counts: Record<string, number>;
  filter: string;
  onFilterChange: (next: string) => void;
  canTriage: boolean;
  staff: StaffIdentity | null;
  onSetStatus: (id: string, status: string) => void;
}

const STATUS_THEMES: Record<
  string,
  { solid: string; tint: string; label: string; border: string }
> = {
  new: {
    solid: "#B45309",
    tint: "#FBF0E2",
    label: "New",
    border: "border-l-[#B45309]",
  },
  in_progress: {
    solid: "#0065AB",
    tint: "#E5F0F9",
    label: "In progress",
    border: "border-l-[#0065AB]",
  },
  done: {
    solid: "#0F7B4F",
    tint: "#E7F4EE",
    label: "Resolved",
    border: "border-l-[#0F7B4F]",
  },
  breached: {
    solid: "#B91C1C",
    tint: "#FBEAE9",
    label: "Breached",
    border: "border-l-[#B91C1C]",
  },
};

export function RequestQueue({
  visible,
  counts,
  filter,
  onFilterChange,
  canTriage,
  staff,
  onSetStatus,
}: RequestQueueProps) {
  // Ops Assistant State
  const ask = useServerFn(askOpsAssistant);
  const [messages, setMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }>
  >([
    {
      id: "welcome",
      role: "assistant",
      content: "Ask about rooms, requests, or tell me to update a status.",
    },
  ]);
  const [input, setInput] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);

  // Derive counts
  const totalOpen = (counts["new"] ?? 0) + (counts["in_progress"] ?? 0);
  const doneCount = counts["done"] ?? 0;

  // Detect breached requests (>10m for maintenance, >20m for general)
  const breachedRequests = useMemo(() => {
    const now = Date.now();
    return visible.filter((r) => {
      if (r.status === "done") return false;
      const ageMinutes = (now - new Date(r.created_at).getTime()) / (60 * 1000);
      const isMaint = r.type.toLowerCase().includes("repair") || r.type.toLowerCase().includes("maint");
      return isMaint ? ageMinutes > 10 : ageMinutes > 20;
    });
  }, [visible]);

  const urgentBreach = breachedRequests[0] ?? null;

  async function handleSendAssistant(text: string) {
    if (!text.trim() || assistantBusy) return;
    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAssistantBusy(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));
      history.push({ role: "user", content: text });

      const response = await ask({ data: { messages: history } });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch {
      toast.error("Assistant service unavailable. Please try again.");
    } finally {
      setAssistantBusy(false);
    }
  }

  const filterOptions = [
    { id: "urgent", label: `Urgent ${breachedRequests.length}` },
    { id: "new", label: `New ${counts["new"] ?? 0}` },
    { id: "in_progress", label: `In progress ${counts["in_progress"] ?? 0}` },
    { id: "done", label: `Done ${doneCount}` },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_330px] items-start">
      {/* Primary Column */}
      <div className="flex flex-col gap-5">
        {/* Header with Filters */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              Live shift · {totalOpen} open · avg response 9m
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#004986]">
              Request queue
            </h1>
          </div>

          {/* Filter Group */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {filterOptions.map((f) => {
              const isActive = filter === f.id || (filter === "all" && f.id === "urgent");
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFilterChange(f.id)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    isActive
                      ? "bg-[#004986] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* "Do This Next" SLA Breach Banner */}
        {urgentBreach ? (
          <section className="rounded-2xl bg-[#004986] p-6 text-white shadow-sm md:p-7">
            <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">
              Do this next · Priority SLA
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold leading-snug tracking-tight">
              Room {urgentBreach.room} has waited {timeAgo(urgentBreach.created_at)}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
              Maintenance requests over 10 minutes breach the property service standard. Fast response preserves guest satisfaction.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onSetStatus(urgentBreach.id, "in_progress");
                  toast.success(`Dispatched staff to Room ${urgentBreach.room}`);
                }}
                className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-[#004986] shadow-sm transition hover:bg-[#D4AF37]/90"
              >
                Dispatch to Room {urgentBreach.room}
              </button>
              <button
                type="button"
                onClick={() => toast.info(`Connecting front desk to Room ${urgentBreach.room}`)}
                className="rounded-xl border border-white/35 bg-transparent px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Call guest
              </button>
            </div>
          </section>
        ) : null}

        {/* Queue List */}
        <ul className="flex flex-col gap-3">
          {visible.length === 0 ? (
            <li className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No requests matching this filter.
            </li>
          ) : (
            visible.map((req) => {
              const isBreached = breachedRequests.some((b) => b.id === req.id);
              const theme = isBreached
                ? STATUS_THEMES.breached
                : STATUS_THEMES[req.status] ?? STATUS_THEMES.new;

              return (
                <li
                  key={req.id}
                  className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 ${theme.border} border-l-4`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="font-mono text-xl font-bold text-[#004986]">
                          {req.room}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {req.type}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: theme.tint,
                            color: theme.solid,
                          }}
                        >
                          {isBreached ? "Breached" : theme.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {req.guest_name ? `${req.guest_name} · ` : ""}
                          {timeAgo(req.created_at)}
                        </span>
                      </div>

                      {req.details ? (
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {req.details}
                        </p>
                      ) : null}

                      <p className="mt-2 text-xs text-slate-400">
                        {req.status === "done"
                          ? `Resolved · ${req.resolved_by_name ?? "Front desk"}`
                          : req.status === "in_progress"
                            ? `Started · ${req.started_by_name ?? "Staff"}`
                            : `Opened · not yet assigned`}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {canTriage ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {req.status === "new" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onSetStatus(req.id, "in_progress")}
                              className="rounded-xl bg-[#004986] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#004986]/90"
                            >
                              Start
                            </button>
                            <button
                              type="button"
                              onClick={() => toast.info("Staff assignment opened")}
                              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#004986] shadow-sm hover:bg-slate-50"
                            >
                              Assign
                            </button>
                          </>
                        ) : req.status === "in_progress" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onSetStatus(req.id, "done")}
                              className="rounded-xl bg-[#004986] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#004986]/90"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => toast.info("Reassigning request")}
                              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#004986] shadow-sm hover:bg-slate-50"
                            >
                              Reassign
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onSetStatus(req.id, "in_progress")}
                              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Reopen
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">View only</span>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Sidebar Column */}
      <aside className="flex flex-col gap-4">
        {/* 1. Today Stats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold tracking-widest text-[#004986] uppercase">
            Today
          </p>
          <div className="mt-3.5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Opened</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#004986]">{totalOpen + doneCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Resolved</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#0F7B4F]">{doneCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Avg response</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#004986]">9m</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Breached</p>
              <p className="mt-1 font-mono text-2xl font-bold text-rose-600">{breachedRequests.length}</p>
            </div>
          </div>
        </div>

        {/* 2. Ops Assistant */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-[#004986] uppercase">
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            Ops Assistant
          </p>

          <div className="mt-3 max-h-48 space-y-2.5 overflow-y-auto rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "assistant" ? (
                  <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#004986]" />
                ) : null}
                <div
                  className={`rounded-lg px-2.5 py-1.5 leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#004986] text-white"
                      : "bg-white text-slate-800 shadow-xs"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" ? (
                  <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : null}
              </div>
            ))}
            {assistantBusy ? (
              <div className="text-[11px] text-slate-400 italic">Thinking…</div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendAssistant(input);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rooms or requests…"
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#004986] focus:outline-none"
            />
            <button
              type="submit"
              disabled={assistantBusy || !input.trim()}
              className="grid h-8 w-8 place-items-center rounded-xl bg-[#004986] text-white transition hover:bg-[#004986]/90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {["Property summary", "Dirty rooms on floor 2", "Mark 214 clean"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void handleSendAssistant(chip)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* 3. System Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold tracking-widest text-[#004986] uppercase">
            System
          </p>
          <ul className="mt-3 divide-y divide-slate-100 text-xs">
            <li className="flex items-center justify-between py-2">
              <span className="text-slate-500">Database</span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Configured
              </span>
            </li>
            <li className="flex items-center justify-between py-2">
              <span className="text-slate-500">Mode</span>
              <span className="flex items-center gap-1.5 font-bold text-[#0065AB]">
                <span className="h-2 w-2 rounded-full bg-[#0065AB]" />
                Live production
              </span>
            </li>
            <li className="flex items-center justify-between py-2">
              <span className="text-slate-500">Last sync</span>
              <span className="font-mono text-slate-400">Just now</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guestRequests } from "@/lib/guest.functions";
import { FranchiseLegal, FranchiseDisclaimer, BOOKING_URL } from "@/components/franchise-footer";
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Row = {
  id: string;
  type: string;
  details: string | null;
  status: string;
  created_at: string;
};

const STEPS = ["new", "in_progress", "done"] as const;
const STEP_CONFIG: Record<string, { label: string; description: string }> = {
  new: { label: "Received", description: "Dispatched to on-site team" },
  in_progress: { label: "On The Way", description: "Staff is fulfilling your request" },
  done: { label: "Completed", description: "Delivered & resolved" },
};

function requestLabel(type: string) {
  return type.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const Route = createFileRoute("/track")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Track Request Status — Days Inn® by Wyndham Wildwood I-75" },
      {
        name: "description",
        content:
          "Check the live status of your in-room requests at Days Inn® by Wyndham Wildwood I-75 — received, on the way, or completed.",
      },
      {
        property: "og:title",
        content: "Track Request Status — Days Inn® by Wyndham Wildwood I-75",
      },
      {
        property: "og:description",
        content:
          "Enter your room number and last name to follow your front-desk requests in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const fetchRequests = useServerFn(guestRequests);
  const [room, setRoom] = useState("");
  const [lastName, setLastName] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRequests({
        data: { room: room.trim(), lastName: lastName.trim() },
      });
      if (!result.ok) {
        setRows(null);
        setError("We couldn't match that room and last name. Please check with the front desk.");
      } else {
        setRows(result.requests as Row[]);
      }
    } catch {
      setError("Something went wrong retrieving your request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-amber/30 selection:text-ink">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 px-6 py-4 backdrop-blur-xl md:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <BrandLockup />
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="spring-hover inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Guest hub
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-8 flex-1">
        <div className="text-center max-w-lg mx-auto">
          <span className="signage text-accent font-bold">Days Inn® by Wyndham Wildwood I-75</span>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Track your <span className="text-primary">request</span>.
          </h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Enter your room number and last name to view live status updates on towels, repairs, or
            housekeeping.
          </p>
        </div>

        {/* Lookup Card */}
        <section className="glass-card mt-8 rounded-3xl p-6 md:p-8">
          <form onSubmit={lookup} className="grid gap-4 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="track-room" className="text-xs font-semibold text-foreground">
                Room Number
              </Label>
              <Input
                id="track-room"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
                placeholder="e.g. 214"
                className="h-11 rounded-xl border-border/80 bg-background/80 text-sm focus-visible:ring-accent"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="track-name" className="text-xs font-semibold text-foreground">
                Last Name
              </Label>
              <Input
                id="track-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="e.g. Smith"
                className="h-11 rounded-xl border-border/80 bg-background/80 text-sm focus-visible:ring-accent"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="spring-hover h-11 rounded-xl bg-accent px-6 font-bold text-accent-foreground shadow-md hover:brightness-105"
            >
              {loading ? (
                "Searching…"
              ) : (
                <span className="flex items-center gap-1.5">
                  <Search className="h-4 w-4" /> Check
                </span>
              )}
            </Button>
          </form>

          {error ? (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {error}{" "}
                <a href="tel:+13527487766" className="font-bold underline underline-offset-2">
                  Call the front desk
                </a>
                .
              </span>
            </div>
          ) : null}
        </section>

        {/* Results Area */}
        {rows ? (
          rows.length === 0 ? (
            <div className="glass-panel mt-6 rounded-3xl p-8 text-center">
              <p className="font-serif text-base font-bold text-foreground">
                No active requests found
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                There are no open room tickets currently logged for Room {room}.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <h2 className="font-serif text-lg font-bold text-foreground">
                Requests for Room {room} ({rows.length})
              </h2>

              <ul className="space-y-4">
                {rows.map((row) => {
                  const currentStepIndex = STEPS.indexOf(row.status as (typeof STEPS)[number]);
                  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

                  return (
                    <li key={row.id} className="glass-card rounded-3xl p-6 transition-all">
                      <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                        <div>
                          <span className="font-serif text-base font-bold text-foreground">
                            {requestLabel(row.type)}
                          </span>
                          {row.details ? (
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                              {row.details}
                            </p>
                          ) : null}
                        </div>
                        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                          {STEP_CONFIG[row.status]?.label ?? row.status}
                        </span>
                      </div>

                      {/* Multi-Step Timeline */}
                      <div className="mt-6">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {STEPS.map((step, idx) => {
                            const isPast = idx < activeIndex;
                            const isCurrent = idx === activeIndex;
                            const config = STEP_CONFIG[step] ?? { label: step, description: "" };

                            return (
                              <div key={step} className="flex flex-col items-center">
                                <div
                                  className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all ${
                                    isPast
                                      ? "bg-emerald-500 text-white"
                                      : isCurrent
                                        ? "bg-accent text-accent-foreground ring-4 ring-accent/20 animate-pulse"
                                        : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {isPast ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                </div>
                                <span
                                  className={`mt-2 font-serif text-xs font-bold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}
                                >
                                  {config.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground hidden sm:block">
                                  {config.description}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Progress Line */}
                        <div className="relative mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-accent transition-all duration-500"
                            style={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      <p className="mt-4 text-right text-[10px] text-muted-foreground">
                        Logged {new Date(row.created_at).toLocaleString()}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        ) : null}

        {/* Wyndham Rewards Callout */}
        <section className="glass-panel mt-10 rounded-3xl p-6 border border-accent/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-accent">
                <ShieldCheck className="h-3.5 w-3.5" /> Wyndham Rewards®
              </span>
              <p className="mt-1 font-serif text-base font-bold text-foreground">
                Earn 10 points per dollar or 1,000 points on direct qualifying stays.
              </p>
              <FranchiseDisclaimer className="mt-1 text-[11px] text-muted-foreground" />
            </div>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="spring-hover rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-sm hover:brightness-105"
            >
              Learn more ↗
            </a>
          </div>
        </section>

        <div className="mt-6 rounded-2xl border border-border/80 bg-card/60 p-5 text-center text-xs text-muted-foreground">
          Want in-room concierge chat and your digital key?{" "}
          <Link
            to="/checkin"
            className="font-bold text-primary underline underline-offset-4 hover:text-accent"
          >
            Sign in to your room →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-border/80 bg-card/40 py-6 px-6">
        <div className="mx-auto max-w-5xl space-y-2">
          <FranchiseLegal />
        </div>
      </footer>
    </div>
  );
}

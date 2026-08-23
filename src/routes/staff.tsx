import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { readPresentationMode, setPresentationMode } from "@/lib/presentation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLockup } from "@/components/brand-lockup";
import { TeamPanel } from "@/components/team-panel";
import { InvitePanel } from "@/components/invite-panel";
import { RequestWorkflowPanel } from "@/components/request-workflow-panel";
import { advanceRequest } from "@/lib/request-workflow";
import { useStaffRole } from "@/hooks/use-staff-role";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { claimFirstManager } from "@/lib/roles.functions";
import { GuidedTour, type TourStep } from "@/components/guided-tour";
import { Menu } from "lucide-react";

const TOUR_STEPS: TourStep[] = [
  {
    title: "The dispatch desk",
    body: "Every guest request lands here the moment it's submitted — no phone tag, no paper slips. This walkthrough shows how a shift works it.",
  },
  {
    target: "counts",
    title: "Shift at a glance",
    body: "New, In progress, and Done update live. A manager can read the floor's workload in one glance from anywhere in the property.",
  },
  {
    target: "filters",
    title: "Filter the board",
    body: "Narrow the queue to just what needs attention — usually New during a busy check-in window, Done for an end-of-shift review.",
  },
  {
    target: "queue",
    title: "The request itself",
    body: "Room, guest, timestamp, and the guest's own words. Everything the person walking up the stairs needs, without calling the desk back.",
  },
  {
    target: "triage",
    title: "Triage and status updates",
    body: "One tap moves a request to In progress — that's the assignment signal to the rest of the team — and another closes it out as Done. The guest view and every other screen update instantly.",
  },
  {
    target: "team",
    title: "Who can do what",
    body: "Managers assign roles here: staff can triage requests, viewers watch the board read-only, and only managers can remove records.",
  },
];



type RequestRow = {
  id: string;
  room: string;
  guest_name: string | null;
  type: string;
  details: string | null;
  status: string;
  created_at: string;
  started_at?: string | null;
  started_by_name?: string | null;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
};

const STATUSES = ["new", "in_progress", "done"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  done: "Done",
};
const STATUS_ACCENT: Record<string, string> = {
  new: "bg-amber",
  in_progress: "bg-sage",
  done: "bg-cream/25",
};
const NEXT_ACTION: Record<string, { status: string; label: string } | null> = {
  new: { status: "in_progress", label: "Start" },
  in_progress: { status: "done", label: "Complete" },
  done: null,
};

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}


export const Route = createFileRoute("/staff")({
  ssr: false,
  validateSearch: z.object({
    demo: z.coerce.boolean().optional(),
    present: z.coerce.boolean().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Staff Dashboard — Days Inn Hub" },
      {
        name: "description",
        content:
          "Front-desk dashboard for routing guest requests: triage new asks, mark them in progress, and close them out.",
      },
      { property: "og:title", content: "Staff Dashboard — Days Inn Hub" },
      {
        property: "og:description",
        content: "Triage and close out guest requests from one live queue.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffPage,
});

const DEMO_ROWS: RequestRow[] = [
  {
    id: "demo-1",
    room: "214",
    guest_name: "M. Alvarez",
    type: "Extra towels",
    details: "Two bath towels, please — no rush.",
    status: "new",
    created_at: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: "demo-2",
    room: "118",
    guest_name: "J. Whitfield",
    type: "Maintenance",
    details: "The AC unit is rattling when it kicks on.",
    status: "new",
    created_at: new Date(Date.now() - 21 * 60000).toISOString(),
  },
  {
    id: "demo-3",
    room: "307",
    guest_name: null,
    type: "Housekeeping",
    details: "Room refresh after 2pm if possible.",
    status: "in_progress",
    created_at: new Date(Date.now() - 58 * 60000).toISOString(),
  },
  {
    id: "demo-4",
    room: "102",
    guest_name: "R. Ulloa",
    type: "Front desk question",
    details: "What time does the shuttle run to the airport?",
    status: "done",
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
];

function StaffPage() {
  const { demo: demoParam, present: presentParam } = useSearch({ from: "/staff" });
  const navigate = useNavigate({ from: "/staff" });
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(Boolean(demoParam || presentParam));
  const present = Boolean(demo && presentParam);

  useEffect(() => {
    const remembered = readPresentationMode();
    if (demoParam || presentParam) setPresentationMode(true);
    setDemo(Boolean(demoParam || presentParam) || remembered);
  }, [demoParam, presentParam]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-cream/60">
        Loading…
      </div>
    );
  }

  const exitDemo = () => {
    setPresentationMode(false);
    setDemo(false);
    void navigate({ to: "/staff", search: {} });
  };

  if (session) return <Dashboard />;
  if (demo) return <Dashboard demo present={present} onExitDemo={exitDemo} />;
  return <SignIn onDemo={() => setDemo(true)} />;
}

function SignIn({ onDemo }: { onDemo: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const credentials = { email: email.trim(), password };
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({
            ...credentials,
            options: { emailRedirectTo: `${window.location.origin}/staff` },
          });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (mode === "signup") {
      toast.success("Check your email to confirm the account.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-cream">
      <div className="w-full max-w-sm">
        <BrandLockup tone="cream" />
        <Link
          to="/"
          className="signage mt-8 inline-block text-cream/60 transition-colors duration-200 hover:text-amber"
        >
          ← Guest view
        </Link>
        <h1 className="mt-4 text-4xl">Staff sign in</h1>
        <p className="mt-2 text-sm text-cream/60">
          A cleaner queue means a calmer shift. Sign in to work the board.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber text-ink hover:bg-amber/90"
            disabled={busy}
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-cream/60 underline-offset-4 hover:text-amber hover:underline"
        >
          {mode === "signin"
            ? "Need a staff account? Create one"
            : "Already have an account? Sign in"}
        </button>
        <div className="mt-8 border-t border-cream/15 pt-6">
          <p className="signage flex items-center gap-2 text-cream/50">
            <span aria-hidden className="h-3 w-[3px] bg-amber" />
            Presenting?
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
            onClick={onDemo}
          >
            Open demo view
          </Button>
          <Link
            to="/staff"
            search={{ demo: true, present: true }}
            className="signage mt-3 inline-block text-sm text-cream/50 transition-colors duration-200 hover:text-amber"
          >
            Open presentation mode →
          </Link>
          <p className="mt-2 text-xs text-cream/40">
            Sample requests only — no real guest data, nothing is saved.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  demo = false,
  present = false,
  onExitDemo,
}: {
  demo?: boolean;
  present?: boolean;
  onExitDemo?: () => void;
}) {
  const [rows, setRows] = useState<RequestRow[]>(demo ? DEMO_ROWS : []);
  const [filter, setFilter] = useState<string>("all");
  const role = useStaffRole();
  const roleLoading = demo ? false : role.loading;
  const isManager = demo ? false : role.isManager;
  const canTriage = demo ? true : role.canTriage;
  const refresh = role.refresh;
  const claimManager = useServerFn(claimFirstManager);
  const [claiming, setClaiming] = useState(false);
  const [tourOpen, setTourOpen] = useState(present);
  const [menuOpen, setMenuOpen] = useState(false);
  const { staff } = useStaffIdentity();

  useEffect(() => {
    if (demo) setTourOpen(true);
  }, [demo]);



  useEffect(() => {
    if (demo) return;
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from("requests")
        .select("id, room, guest_name, type, details, status, created_at, started_at, started_by_name, resolved_at, resolved_by_name")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        toast.error("Couldn't load the queue.");
        return;
      }
      setRows((data ?? []) as RequestRow[]);
    }
    load();

    const channel = supabase
      .channel("requests-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [demo]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.status === filter)),
    [rows, filter],
  );

  const counts = useMemo(
    () => ({
      new: rows.filter((row) => row.status === "new").length,
      in_progress: rows.filter((row) => row.status === "in_progress").length,
      done: rows.filter((row) => row.status === "done").length,
    }),
    [rows],
  );

  async function setStatus(id: string, status: string) {
    if (!canTriage) {
      toast.error("You don't have permission to triage requests.");
      return;
    }
    if (demo) {
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status } : row)),
      );
      return;
    }
    const previous = rows;
    const row = previous.find((r) => r.id === id);
    if (!row) return;
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    const { error } = await advanceRequest(row, status, staff ?? null);
    if (error) {
      setRows(previous);
      toast.error("Update failed — your role may not allow this.");
    }
  }

  async function claim() {
    setClaiming(true);
    try {
      const { claimed } = await claimManager({ data: undefined });
      if (claimed) {
        toast.success("You're now the manager.");
        await refresh();
      } else {
        toast.error("A manager already exists — ask them for access.");
      }
    } catch {
      toast.error("Couldn't complete setup.");
    }
    setClaiming(false);
  }


  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-ink px-6 pb-16 text-cream md:px-12">
      <header className="sticky top-0 z-20 -mx-6 flex flex-wrap items-center justify-between gap-4 border-b border-cream/15 bg-ink/95 px-6 py-4 backdrop-blur md:-mx-12 md:px-12">
        <div className="flex items-center gap-5">
          <BrandLockup tone="cream" />
          <div className="hidden h-8 w-px bg-cream/15 md:block" />
          <div className="hidden md:block">
            <p className="signage flex items-center gap-2 text-cream/60">
              <span aria-hidden className="h-3 w-[3px] bg-amber" />
              {demo ? "Demo shift" : "Live shift"}
            </p>
            <h1 className="mt-1 font-display text-2xl leading-none">
              Request queue
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTourOpen(true)}
            className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
          >
            Walkthrough
          </button>
          <Link
                to="/front-desk"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Front desk
              </Link>
              <Link
                to="/housekeeping"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Housekeeping
              </Link>
          <Link
                to="/"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Guest view
              </Link>
          {!present ? (
            <Button
              variant="outline"
              size="sm"
              className="border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
              onClick={demo ? onExitDemo : signOut}
            >
              {demo ? "Exit demo" : "Sign out"}
            </Button>
          ) : null}
        </div>
      </header>

      {demo ? (
        <div className="mt-8 border border-amber/50 bg-amber/10 p-5">
          <p className="signage text-amber">Demo view</p>
          <p className="mt-2 max-w-2xl text-sm text-cream/70">
            Sample requests for presentation only — nothing here is real guest
            data, and status changes are not saved.
          </p>
        </div>
      ) : null}

      {!demo && !roleLoading && !canTriage ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-amber/50 bg-amber/10 p-5">
          <div>
            <p className="signage text-amber">View-only access</p>
            <p className="mt-2 text-sm text-cream/70">
              You can watch the queue, but a manager must grant you staff access
              before you can triage requests.
            </p>
          </div>
          <Button
            size="sm"
            disabled={claiming}
            className="bg-amber text-ink hover:bg-amber/90"
            onClick={claim}
          >
            {claiming ? "Setting up…" : "I'm the first manager"}
          </Button>
        </div>
      ) : null}



      <div className="mt-6 grid gap-3 sm:grid-cols-3" data-tour="counts">
        {STATUSES.map((status) => {
          const active = filter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(active ? "all" : status)}
              aria-pressed={active}
              className={`group flex items-center justify-between border p-4 text-left transition-colors duration-200 ${
                active
                  ? "border-amber/70 bg-cream/[0.07]"
                  : "border-cream/15 bg-cream/[0.04] hover:border-cream/35"
              }`}
            >
              <p className="signage flex items-center gap-2 text-cream/60">
                <span
                  aria-hidden
                  className={`h-3 w-[3px] ${STATUS_ACCENT[status]}`}
                />
                {STATUS_LABEL[status]}
              </p>
              <p className="font-display text-3xl leading-none tabular-nums">
                {counts[status]}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className="mt-5 flex flex-wrap items-center gap-2 border-b border-cream/10 pb-4"
        data-tour="filters"
      >
        <span className="signage mr-1 text-cream/40">Filter</span>
        {["all", ...STATUSES].map((option) => (
          <Button
            key={option}
            size="sm"
            variant="outline"
            className={
              filter === option
                ? "border-amber bg-amber text-ink hover:bg-amber/90"
                : "border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
            }
            onClick={() => setFilter(option)}
          >
            {option === "all" ? "All" : STATUS_LABEL[option]}
          </Button>
        ))}
        <span className="ml-auto text-xs text-cream/40">
          {visible.length} shown
        </span>
      </div>


      {visible.length === 0 ? (
        <div className="mt-10 border border-dashed border-cream/20 bg-cream/[0.02] p-10 text-center">
          <p className="font-display text-2xl">Queue is clear</p>
          <p className="mt-2 text-sm text-cream/60">
            New guest requests land here automatically.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2" data-tour="queue">
          {visible.map((row) => {
            const next = NEXT_ACTION[row.status];
            const others = STATUSES.filter(
              (status) => status !== row.status && status !== next?.status,
            );
            return (
              <li
                key={row.id}
                className={`group relative border border-cream/15 bg-cream/[0.04] p-4 pl-6 transition-colors duration-200 hover:border-amber/60 ${row.status === "done" ? "opacity-70" : ""}`}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-0 h-full w-[3px] ${STATUS_ACCENT[row.status]}`}
                />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-display text-2xl tabular-nums">
                        {row.room}
                      </span>
                      <span className="text-base text-cream">{row.type}</span>
                      <Badge
                        className={
                          row.status === "new"
                            ? "bg-amber text-ink"
                            : row.status === "in_progress"
                              ? "bg-sage text-ink"
                              : "bg-cream/15 text-cream"
                        }
                      >
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-cream/50">
                      {row.guest_name ? `${row.guest_name} · ` : ""}
                      <span title={new Date(row.created_at).toLocaleString()}>
                        {timeAgo(row.created_at)}
                      </span>
                    </p>
                    {row.details ? (
                      <p className="mt-2 max-w-2xl text-sm text-cream/85">
                        {row.details}
                      </p>
                    ) : null}
                  </div>
                  {canTriage ? (
                    <div
                      className="flex flex-wrap items-center gap-2"
                      data-tour={row.id === visible[0]?.id ? "triage" : undefined}
                    >
                      {next ? (
                        <Button
                          size="sm"
                          className="bg-amber text-ink hover:bg-amber/90"
                          onClick={() => setStatus(row.id, next.status)}
                        >
                          {next.label}
                        </Button>
                      ) : null}
                      {others.map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          className="border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                          onClick={() => setStatus(row.id, status)}
                        >
                          {STATUS_LABEL[status]}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="signage text-cream/40">View only</p>
                  )}
                </div>
                {demo ? null : (
                  <RequestWorkflowPanel
                    request={row}
                    canEdit={canTriage}
                    staff={staff ?? null}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}


      {isManager ? (
        <div data-tour="team">
          <TeamPanel />
          <InvitePanel />
        </div>
      ) : null}

      <GuidedTour
        steps={TOUR_STEPS.filter(
          (step) =>
            (step.target !== "team" || isManager) &&
            (step.target !== "triage" || canTriage),
        )}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>

  );
}

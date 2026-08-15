import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BrandLockup } from "@/components/brand-lockup";
import { TeamPanel } from "@/components/team-panel";
import { useStaffRole } from "@/hooks/use-staff-role";
import { claimFirstManager } from "@/lib/roles.functions";


type RequestRow = {
  id: string;
  room: string;
  guest_name: string | null;
  type: string;
  details: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "in_progress", "done"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  done: "Done",
};

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Dashboard — Rodeway Hub" },
      {
        name: "description",
        content:
          "Front-desk dashboard for routing guest requests: triage new asks, mark them in progress, and close them out.",
      },
      { property: "og:title", content: "Staff Dashboard — Rodeway Hub" },
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
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(false);

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

  if (session) return <Dashboard />;
  if (demo) return <Dashboard demo onExitDemo={() => setDemo(false)} />;
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
      </div>
    </div>
  );
}

function Dashboard({
  demo = false,
  onExitDemo,
}: {
  demo?: boolean;
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


  useEffect(() => {
    if (demo) return;
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from("requests")
        .select("id, room, guest_name, type, details, status, created_at")
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
    const previous = rows;
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status } : row)),
    );
    const { error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", id);
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
    <div className="min-h-screen bg-ink px-6 py-8 text-cream md:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/15 pb-6">
        <div>
          <BrandLockup tone="cream" />
          <p className="signage mt-6 flex items-center gap-2 text-cream/60">
            <span aria-hidden className="h-3 w-[3px] bg-amber" />
            Dispatch desk · Live shift
          </p>
          <h1 className="mt-3 text-4xl">Request queue</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
          >
            Guest view
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
            onClick={signOut}
          >
            Sign out
          </Button>
        </div>
      </header>

      {!roleLoading && !canTriage ? (
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



      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STATUSES.map((status) => (
          <div
            key={status}
            className="border border-cream/15 bg-cream/[0.04] p-5"
          >
            <p className="signage flex items-center gap-2 text-cream/60">
              <span
                aria-hidden
                className={`h-3 w-[3px] ${status === "new" ? "bg-amber" : status === "in_progress" ? "bg-sage" : "bg-cream/30"}`}
              />
              {STATUS_LABEL[status]}
            </p>
            <p className="mt-3 font-display text-4xl tabular-nums">
              {counts[status]}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
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
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-sm text-cream/60">
          Nothing here yet. New guest requests land automatically.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {visible.map((row) => (
            <li
              key={row.id}
              className="border border-cream/15 bg-cream/[0.04] p-5 transition-colors duration-200 hover:border-amber/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-xl">{row.type}</span>
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
                  <p className="mt-1 text-sm text-cream/60">
                    Room {row.room}
                    {row.guest_name ? ` · ${row.guest_name}` : ""} ·{" "}
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                  {row.details ? (
                    <p className="mt-3 max-w-2xl text-sm">{row.details}</p>
                  ) : null}
                </div>
                {canTriage ? (
                  <div className="flex gap-2">
                    {STATUSES.filter((status) => status !== row.status).map(
                      (status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          className="border-cream/25 bg-transparent text-cream/80 hover:bg-cream/10 hover:text-cream"
                          onClick={() => setStatus(row.id, status)}
                        >
                          {STATUS_LABEL[status]}
                        </Button>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="signage text-cream/40">View only</p>
                )}

              </div>
            </li>
          ))}
        </ul>
      )}

      {isManager ? <TeamPanel /> : null}
    </div>

  );
}

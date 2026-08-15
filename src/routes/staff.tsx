import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

function StaffPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return session ? <Dashboard /> : <SignIn />;
}

function SignIn() {
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
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          ← Guest view
        </Link>
        <h1 className="mt-6 text-4xl">Staff sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The request queue is limited to front-desk staff.
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
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {mode === "signin"
            ? "Need a staff account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
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
  }, []);

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
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status } : row)),
    );
    const { error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", id);
    if (error) toast.error("Update failed.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen px-6 py-8 md:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Dispatch desk
          </p>
          <h1 className="mt-2 text-4xl">Request queue</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            Guest view
          </Link>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STATUSES.map((status) => (
          <div key={status} className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {STATUS_LABEL[status]}
            </p>
            <p className="mt-2 text-3xl tabular-nums">{counts[status]}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((option) => (
          <Button
            key={option}
            size="sm"
            variant={filter === option ? "default" : "outline"}
            onClick={() => setFilter(option)}
          >
            {option === "all" ? "All" : STATUS_LABEL[option]}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">
          Nothing here yet. New guest requests land automatically.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {visible.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg">{row.type}</span>
                    <Badge variant={row.status === "done" ? "secondary" : "default"}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Room {row.room}
                    {row.guest_name ? ` · ${row.guest_name}` : ""} ·{" "}
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                  {row.details ? (
                    <p className="mt-3 max-w-2xl text-sm">{row.details}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {STATUSES.filter((status) => status !== row.status).map(
                    (status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(row.id, status)}
                      >
                        {STATUS_LABEL[status]}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

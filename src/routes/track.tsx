import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guestRequests } from "@/lib/guest.functions";
import { FranchiseLegal } from "@/components/franchise-footer";

type Row = {
  id: string;
  type: string;
  details: string | null;
  status: string;
  created_at: string;
};

const STEPS = ["new", "in_progress", "done"] as const;
const STEP_LABEL: Record<string, string> = {
  new: "Received",
  in_progress: "On the way",
  done: "Completed",
};

export const Route = createFileRoute("/track")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Track a Request — Days Inn® by Wyndham Wildwood" },
      {
        name: "description",
        content:
          "Check the live status of anything you asked the front desk for — received, on the way, or completed.",
      },
      { property: "og:title", content: "Track a Request — Days Inn® by Wyndham Wildwood" },
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
        setError("We couldn't match that room and last name. Check with the front desk.");
      } else {
        setRows(result.requests as Row[]);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-12">
        <BrandLockup />
        <nav className="flex items-center gap-4">
          <Link to="/" className="signage text-muted-foreground hover:text-foreground">
            Guest hub
          </Link>
          <Link to="/guide" className="signage text-muted-foreground hover:text-foreground">
            Local guide
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10 md:px-12">
        <p className="signage flex items-center gap-2 text-muted-foreground">
          <span aria-hidden className="h-3 w-[3px] bg-amber" />
          Request status
        </p>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] md:text-5xl">
          Track your <em className="text-amber">request.</em>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          No app, no sign-in code. Just your room number and the last name on the
          reservation.
        </p>

        <form onSubmit={lookup} className="mt-6 grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="track-room">Room</Label>
            <Input
              id="track-room"
              value={room}
              onChange={(event) => setRoom(event.target.value)}
              placeholder="e.g. 214"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="track-name">Last name</Label>
            <Input
              id="track-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Ulloa"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="bg-amber text-ink hover:bg-amber/90">
            {loading ? "Checking…" : "Check status"}
          </Button>
        </form>

        {error ? (
          <p className="mt-5 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        {rows ? (
          rows.length === 0 ? (
            <p className="mt-6 border border-dashed border-border p-6 text-sm text-muted-foreground">
              Nothing open for this room right now.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {rows.map((row) => {
                const index = STEPS.indexOf(row.status as (typeof STEPS)[number]);
                return (
                  <li key={row.id} className="border border-border bg-card p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-lg">{row.type}</span>
                      <span className="signage text-amber">
                        {STEP_LABEL[row.status] ?? row.status}
                      </span>
                    </div>
                    {row.details ? (
                      <p className="mt-1 text-sm text-muted-foreground">{row.details}</p>
                    ) : null}
                    <div className="mt-3 flex gap-1" aria-hidden>
                      {STEPS.map((step, stepIndex) => (
                        <span
                          key={step}
                          className={`h-1 flex-1 ${stepIndex <= index ? "bg-amber" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <p className="signage mt-2 text-muted-foreground">
                      Sent {new Date(row.created_at).toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}

        <p className="mt-10 text-sm text-muted-foreground">
          Want to chat with the desk and see your room key?{" "}
          <Link to="/checkin" className="underline decoration-amber decoration-2 underline-offset-4">
            Sign in to your room
          </Link>
          .
        </p>
      </main>

      <FranchiseLegal />
    </div>
  );
}

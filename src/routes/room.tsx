import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { guestRequests } from "@/lib/guest.functions";
import {
  clearGuestSession,
  readGuestSession,
  type GuestSession,
} from "@/lib/guest-session";
import { requestSchema } from "@/lib/request-schema";

const REQUESTS = [
  { id: "towels", label: "Send extra towels", prompt: "How many, and anything else for the bath?" },
  { id: "housekeeping", label: "Request housekeeping", prompt: "Tell us the best time to stop by." },
  { id: "problem", label: "Report a problem", prompt: "What's not working in the room?" },
  { id: "front-desk", label: "Message the front desk", prompt: "What can we help with?" },
  { id: "late-checkout", label: "Ask about late checkout", prompt: "Which time works best for your morning?" },
];

const STATUS_LABEL: Record<string, string> = {
  new: "Received",
  in_progress: "In progress",
  done: "Completed",
};

export const Route = createFileRoute("/room")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Room — Rodeway Hub" },
      {
        name: "description",
        content:
          "Your signed-in room hub: send requests to the front desk and follow their status in real time.",
      },
      { property: "og:title", content: "Your Room — Rodeway Hub" },
      {
        property: "og:description",
        content:
          "Your signed-in room hub: send requests to the front desk and follow their status in real time.",
      },
    ],
  }),
  component: RoomHub,
});

function RoomHub() {
  const navigate = useNavigate();
  const fetchRequests = useServerFn(guestRequests);
  const [session, setSession] = useState<GuestSession | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<(typeof REQUESTS)[number] | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const stored = readGuestSession();
    if (!stored) {
      navigate({ to: "/checkin" });
      return;
    }
    setSession(stored);
    setReady(true);
  }, [navigate]);

  const history = useQuery({
    queryKey: ["guest-requests", session?.room, session?.lastName],
    enabled: Boolean(session),
    refetchInterval: 15000,
    queryFn: async () =>
      fetchRequests({
        data: { room: session!.room, lastName: session!.lastName },
      }),
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!open || !session) return;
    const parsed = requestSchema.safeParse({
      room: session.room,
      guest_name: session.guestName,
      details,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("requests").insert({
      room: parsed.data.room,
      guest_name: parsed.data.guest_name || null,
      type: open.label,
      details: parsed.data.details || null,
    });
    setSending(false);
    if (error) {
      toast.error("We couldn't send that. Please call the front desk.");
      return;
    }
    toast.success("Sent. We're routing it now.");
    setDetails("");
    setOpen(null);
    void history.refetch();
  }

  function signOut() {
    clearGuestSession();
    navigate({ to: "/checkin" });
  }

  if (!ready || !session) return null;

  const rows = history.data?.requests ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-12">
        <BrandLockup />
        <div className="flex items-center gap-4">
          <span className="signage hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-muted-foreground sm:flex">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" />
            Room {session.room}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="signage text-muted-foreground underline-offset-4 hover:text-ink hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="px-6 py-8 md:px-12">
        <p className="signage flex items-center gap-2 text-muted-foreground">
          <span aria-hidden className="h-3 w-[3px] bg-amber" />
          Signed in · Room {session.room}
        </p>
        <h1 className="mt-2 max-w-xl text-4xl leading-[1.05] md:text-5xl">
          Welcome, <em className="text-amber">{session.guestName}.</em>
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your room is already attached to every request
          {session.checkOut ? ` · Checkout ${session.checkOut}` : ""}
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <h2 className="text-2xl">What do you need?</h2>
            <ul className="mt-3 border-y border-border">
              {REQUESTS.map((request, index) => (
                <li key={request.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpen(request)}
                    className="group flex w-full items-center gap-4 py-3 pl-1 text-left transition-colors duration-200 hover:bg-ink/[0.04]"
                  >
                    <span className="signage w-8 shrink-0 text-amber tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-display text-lg leading-tight">
                      {request.label}
                    </span>
                    <span className="signage pr-1 text-muted-foreground group-hover:text-ink">
                      Send →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl">Your requests</h2>
            {history.isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="mt-3 border border-dashed border-border p-6 text-sm text-muted-foreground">
                Nothing yet. Anything you send will show up here with its status.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {rows.map((row) => (
                  <li key={row.id} className="border border-border bg-card p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-lg">{row.type}</span>
                      <span className="signage text-amber">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </div>
                    {row.details ? (
                      <p className="mt-1 text-sm text-muted-foreground">{row.details}</p>
                    ) : null}
                    <p className="signage mt-2 text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Need something else?{" "}
          <Link to="/" className="underline decoration-amber decoration-2 underline-offset-4">
            Browse the guest hub
          </Link>
        </p>
      </main>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open?.label}</DialogTitle>
            <DialogDescription>{open?.prompt}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-locked">Room</Label>
              <Input id="room-locked" value={session.room} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-details">Details</Label>
              <Textarea
                id="room-details"
                value={details}
                maxLength={1000}
                rows={4}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Anything we should know?"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber text-ink hover:bg-amber/90"
              disabled={sending}
            >
              {sending ? "Sending…" : "Send request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

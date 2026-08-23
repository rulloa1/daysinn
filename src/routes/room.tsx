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
import { guestSendMessage, guestThread } from "@/lib/guest-hub.functions";
import {
  Sparkles,
  BedDouble,
  Wrench,
  MessageSquare,
  Clock,
  KeyRound,
  Send,
  LogOut,
  Wifi,
  Phone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

type GuestMessage = {
  id: string;
  body: string;
  sender: string;
  author_name: string | null;
  created_at: string;
};

import {
  clearGuestSession,
  readGuestSession,
  type GuestSession,
} from "@/lib/guest-session";
import { requestSchema } from "@/lib/request-schema";

const REQUESTS = [
  { id: "towels", label: "Fresh Towels & Linens", prompt: "How many towels or linens do you need for the bath?", icon: Sparkles },
  { id: "housekeeping", label: "Housekeeping Refresh", prompt: "Tell us the best time to stop by for a quick room tidy.", icon: BedDouble },
  { id: "problem", label: "Maintenance & Repairs", prompt: "What needs attention or repair in your room?", icon: Wrench },
  { id: "front-desk", label: "Front Desk Assistance", prompt: "How can our front desk team help you right now?", icon: MessageSquare },
  { id: "late-checkout", label: "Request Late Checkout", prompt: "What time would you prefer to depart tomorrow?", icon: Clock },
];

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
  new: { label: "Received", class: "bg-amber/15 text-amber border-amber/30", icon: Clock },
  in_progress: { label: "In Progress", class: "bg-primary/15 text-primary border-primary/30", icon: AlertCircle },
  done: { label: "Completed", class: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
};

import { FranchiseLegal } from "@/components/franchise-footer";

export const Route = createFileRoute("/room")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your In-Room Concierge — Days Inn® by Wyndham Wildwood I-75" },
      {
        name: "description",
        content:
          "Manage in-room services, request amenities, chat with the front desk, and view your digital room key in real time.",
      },
      { property: "og:title", content: "Your In-Room Concierge — Days Inn® by Wyndham Wildwood I-75" },
      {
        property: "og:description",
        content:
          "Manage in-room services, request amenities, chat with the front desk, and view your digital room key in real time.",
      },
    ],
  }),
  component: RoomHub,
});

function RoomHub() {
  const navigate = useNavigate();
  const fetchRequests = useServerFn(guestRequests);
  const fetchThread = useServerFn(guestThread);
  const sendMessage = useServerFn(guestSendMessage);
  const [session, setSession] = useState<GuestSession | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<(typeof REQUESTS)[number] | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [chatSending, setChatSending] = useState(false);

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

  const thread = useQuery({
    queryKey: ["guest-thread", session?.room, session?.lastName],
    enabled: Boolean(session),
    refetchInterval: 8000,
    queryFn: async () =>
      fetchThread({
        data: { room: session!.room, lastName: session!.lastName },
      }),
  });

  const messages = (thread.data?.messages ?? []) as GuestMessage[];

  async function sendChat(event: React.FormEvent) {
    event.preventDefault();
    const body = chatDraft.trim();
    if (!body || !session) return;
    setChatSending(true);
    const result = await sendMessage({
      data: { room: session.room, lastName: session.lastName, body },
    });
    setChatSending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Message didn't send.");
      return;
    }
    setChatDraft("");
    void thread.refetch();
  }

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
    toast.success("Sent. We're routing it now.", {
      description: "Our staff is on it and will follow up shortly.",
    });
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
    <div className="min-h-screen bg-background text-foreground selection:bg-amber/30 selection:text-ink pb-16">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 px-4 py-3.5 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <BrandLockup />
          
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Room {session.room}
            </span>

            <button
              type="button"
              onClick={signOut}
              className="spring-hover inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-8 md:px-8">
        {/* Welcome Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <span className="signage text-accent font-bold">In-Room Guest Portal</span>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Welcome, <span className="text-primary">{session.guestName || `Guest in ${session.room}`}</span>
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Direct service line for Room {session.room}
              {session.checkOut ? ` · Scheduled Checkout: ${session.checkOut}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:+13527487766"
              className="spring-hover inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-sm hover:border-primary"
            >
              <Phone className="h-3.5 w-3.5 text-accent" />
              Call Desk (352) 748-7766
            </a>
          </div>
        </div>

        {/* Top Section: Quick In-Room Requests Grid */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-serif text-xl font-bold text-foreground">In-Room Concierge Requests</h2>
            <p className="text-xs text-muted-foreground">Tap any service below to request immediate assistance.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {REQUESTS.map((request) => {
              const Icon = request.icon;
              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setOpen(request)}
                  className="glass-card group flex flex-col items-center justify-center rounded-2xl p-4 text-center transition-all duration-200"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="mt-3 font-serif text-sm font-bold text-foreground leading-snug">
                    {request.label}
                  </span>
                  <span className="mt-1 text-[11px] text-accent font-semibold group-hover:translate-x-0.5 transition-transform">
                    Request →
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Middle Section: Active Requests & Digital Key */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* Active Requests List */}
          <section className="glass-card flex flex-col justify-between rounded-3xl p-6 md:p-7">
            <div>
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <h2 className="font-serif text-lg font-bold text-foreground">Your Active Requests</h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "request" : "requests"}
                </span>
              </div>

              {history.isLoading ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Checking request status…</p>
              ) : rows.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-foreground">No active room requests</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select a service above to send towels, housekeeping, or report an issue.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {rows.map((row) => {
                    const status = STATUS_CONFIG[row.status] ?? {
                      label: row.status,
                      class: "bg-muted text-muted-foreground border-border",
                      icon: HelpCircle,
                    };
                    const StatusIcon = status.icon;

                    return (
                      <li
                        key={row.id}
                        className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-background/60 p-4 transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-serif text-sm font-bold text-foreground">
                            {row.type}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.class}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                        {row.details ? (
                          <p className="text-xs text-muted-foreground leading-relaxed">{row.details}</p>
                        ) : null}
                        <p className="text-[10px] text-muted-foreground">
                          Requested at {new Date(row.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-6 border-t border-border/70 pt-4 text-center">
              <Link
                to="/track"
                className="text-xs font-bold text-primary hover:underline underline-offset-4"
              >
                Open full live tracker timeline →
              </Link>
            </div>
          </section>

          {/* Digital Key & Wi-Fi Card */}
          <div className="flex flex-col gap-6">
            <section className="glass-panel relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/95 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-200 border border-accent/30">
                  <KeyRound className="h-3.5 w-3.5" /> Digital Room Key
                </span>
                <span className="text-xs font-semibold text-slate-300">Room {session.room}</span>
              </div>

              {thread.data?.key?.pin ? (
                <div className="mt-5 text-center">
                  <p className="signage text-slate-300">Electronic Keypad PIN</p>
                  <p className="my-2 font-mono text-5xl font-extrabold tracking-[0.25em] text-accent">
                    {thread.data.key.pin}
                  </p>
                  <p className="text-xs text-slate-300">
                    Enter on room door keypad. Valid through checkout.
                  </p>
                </div>
              ) : (
                <div className="my-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xs text-slate-200">
                    Physical keycard active. Front desk can issue an electronic PIN code on request.
                  </p>
                </div>
              )}
            </section>

            {/* In-Room Wi-Fi Quick Details */}
            <section className="glass-card rounded-3xl p-6">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Wifi className="h-4 w-4" />
                <h3 className="font-serif text-base">In-Room Amenities & Wi-Fi</h3>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <p className="flex justify-between border-b border-border/60 pb-1.5">
                  <span className="text-muted-foreground">Network</span>
                  <strong className="text-foreground">DaysInn_Guest</strong>
                </p>
                <p className="flex justify-between border-b border-border/60 pb-1.5">
                  <span className="text-muted-foreground">Breakfast Hours</span>
                  <strong className="text-foreground">6:00 AM – 9:30 AM</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Pool & Sun Deck</span>
                  <strong className="text-foreground">9:00 AM – 10:00 PM</strong>
                </p>
              </div>
            </section>
          </div>

        </div>

        {/* Bottom Section: Real-Time Front Desk Chat */}
        <section className="glass-card mt-10 rounded-3xl p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold text-foreground">Direct Desk Messaging</h2>
                <p className="text-xs text-muted-foreground">Front desk staff monitors this channel live.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Desk Online
            </span>
          </div>

          <div className="flex h-72 flex-col justify-between rounded-2xl border border-border/80 bg-background/50 p-4">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-xs text-muted-foreground">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="font-semibold text-foreground">Start a conversation</p>
                  <p>Send a message to the desk for wake-up calls, questions, or directions.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                      message.sender === "staff"
                        ? "mr-auto border border-border/90 bg-card text-foreground"
                        : "ml-auto border border-accent/40 bg-accent/15 text-foreground"
                    }`}
                  >
                    <p>{message.body}</p>
                    <span className="mt-1 text-[10px] text-muted-foreground font-medium self-end">
                      {message.sender === "staff" ? message.author_name ?? "Front Desk Staff" : "You"} ·{" "}
                      {new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendChat} className="mt-3 flex gap-2 pt-2 border-t border-border/70">
              <Input
                value={chatDraft}
                maxLength={1000}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Type your message to the desk…"
                className="rounded-xl border-border bg-card text-xs focus-visible:ring-accent"
                aria-label="Message the front desk"
              />
              <Button
                type="submit"
                disabled={chatSending || !chatDraft.trim()}
                className="spring-hover rounded-xl bg-accent font-bold text-accent-foreground shadow-sm hover:brightness-105"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border/80 bg-card/40 py-6 px-6">
        <div className="mx-auto max-w-6xl space-y-2">
          <FranchiseLegal />
        </div>
      </footer>

      {/* Request Modal Dialog */}
      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="glass-panel max-w-md border-border/90 bg-card/95 p-6 backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle className="font-serif text-lg font-bold text-foreground">
                  {open?.label}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {open?.prompt}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-locked" className="text-xs font-semibold text-foreground">
                Your Assigned Room
              </Label>
              <Input
                id="room-locked"
                value={`Room ${session.room} (${session.guestName})`}
                readOnly
                disabled
                className="rounded-xl border-border bg-muted/60 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-details" className="text-xs font-semibold text-foreground">
                Special Details or Timing
              </Label>
              <Textarea
                id="room-details"
                value={details}
                maxLength={1000}
                rows={3}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Let us know how many items, preferred timing, or special notes..."
                className="rounded-xl border-border bg-background/80 text-xs"
              />
            </div>

            <Button
              type="submit"
              className="spring-hover w-full rounded-xl bg-accent font-bold text-accent-foreground shadow-md hover:brightness-105"
              disabled={sending}
            >
              {sending ? "Routing request…" : "Send request now"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

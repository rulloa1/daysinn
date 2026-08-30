import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Phone } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { FranchiseLegal } from "@/components/franchise-footer";
import { guestRequests } from "@/lib/guest.functions";
import { guestSendMessage, guestThread, setGuestDnd } from "@/lib/guest-hub.functions";
import { clearGuestSession, readGuestSession, type GuestSession } from "@/lib/guest-session";
import { ActiveRequests } from "@/components/room/active-requests";
import { DndToggle } from "@/components/room/dnd-toggle";
import { DeskChat } from "@/components/room/desk-chat";
import { KeyAndAmenities } from "@/components/room/key-and-amenities";
import { ServiceRequestDialog } from "@/components/room/service-request-dialog";
import {
  REQUESTS,
  type GuestMessage,
  type GuestRequestRow,
  type RoomService,
} from "@/components/room/content";

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
      {
        property: "og:title",
        content: "Your In-Room Concierge — Days Inn® by Wyndham Wildwood I-75",
      },
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
  const updateDnd = useServerFn(setGuestDnd);
  const [session, setSession] = useState<GuestSession | null>(null);
  const [ready, setReady] = useState(false);
  const [openService, setOpenService] = useState<RoomService | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [dndBusy, setDndBusy] = useState(false);

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
      fetchRequests({ data: { room: session!.room, lastName: session!.lastName } }),
  });

  const thread = useQuery({
    queryKey: ["guest-thread", session?.room, session?.lastName],
    enabled: Boolean(session),
    refetchInterval: 8000,
    queryFn: async () =>
      fetchThread({ data: { room: session!.room, lastName: session!.lastName } }),
  });

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

  async function toggleDnd(next: boolean) {
    if (!session) return;
    setDndBusy(true);
    const result = await updateDnd({
      data: { room: session.room, lastName: session.lastName, dnd: next },
    });
    setDndBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? "Could not update the sign.");
      return;
    }
    toast.success(next ? "Do Not Disturb is on." : "Do Not Disturb is off.");
    void thread.refetch();
  }

  function signOut() {
    clearGuestSession();
    navigate({ to: "/checkin" });
  }

  if (!ready || !session) return null;

  const rows = (history.data?.requests ?? []) as GuestRequestRow[];
  const messages = (thread.data?.messages ?? []) as GuestMessage[];

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground selection:bg-amber/30 selection:text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 px-4 py-3.5 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <BrandLockup />

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Room {session.room}
            </span>

            <button
              type="button"
              onClick={signOut}
              className="spring-hover inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <span className="signage font-bold text-accent">In-Room Guest Portal</span>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Welcome,{" "}
              <span className="text-primary">
                {session.guestName || `Guest in ${session.room}`}
              </span>
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

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-serif text-xl font-bold text-foreground">
              In-Room Concierge Requests
            </h2>
            <p className="text-xs text-muted-foreground">
              Tap any service below to request immediate assistance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {REQUESTS.map((request) => {
              const Icon = request.icon;
              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setOpenService(request)}
                  className="glass-card group flex flex-col items-center justify-center rounded-2xl p-4 text-center transition-all duration-200"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="mt-3 font-serif text-sm font-bold leading-snug text-foreground">
                    {request.label}
                  </span>
                  <span className="mt-1 text-[11px] font-semibold text-accent transition-transform group-hover:translate-x-0.5">
                    Request →
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <ActiveRequests rows={rows} loading={history.isLoading} />
          <div className="space-y-6">
            <DndToggle
              active={Boolean(thread.data?.dnd)}
              busy={dndBusy}
              onToggle={(next) => void toggleDnd(next)}
            />
            <KeyAndAmenities room={session.room} pin={thread.data?.key?.pin} />
          </div>
        </div>

        <DeskChat
          messages={messages}
          draft={chatDraft}
          onDraftChange={setChatDraft}
          sending={chatSending}
          onSend={sendChat}
        />
      </main>

      <footer className="mt-12 border-t border-border/80 bg-card/40 px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-2">
          <FranchiseLegal />
        </div>
      </footer>

      <ServiceRequestDialog
        service={openService}
        session={session}
        onClose={() => setOpenService(null)}
        onSent={() => void history.refetch()}
      />
    </div>
  );
}

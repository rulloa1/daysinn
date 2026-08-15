import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import roomDusk from "@/assets/room-dusk.jpg";

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=28.80252200339344,-82.13464007721517";

const REQUESTS = [
  {
    id: "towels",
    label: "Send extra towels",
    blurb: "Freshen up your room",
    prompt: "How many, and anything else for the bath?",
  },
  {
    id: "housekeeping",
    label: "Request housekeeping",
    blurb: "Choose a quick refresh",
    prompt: "Tell us the best time to stop by.",
  },
  {
    id: "problem",
    label: "Report a problem",
    blurb: "We'll route the right person",
    prompt: "What's not working in the room?",
  },
  {
    id: "front-desk",
    label: "Message the front desk",
    blurb: "Ask a question or make a request",
    prompt: "What can we help with?",
  },
];

const STOPS = [
  {
    title: "Breakfast near your stay",
    body: "Use the property map to find nearby breakfast and coffee options.",
  },
  {
    title: "Gas + essentials",
    body: "Open the map for nearby fuel, snacks, and travel basics.",
  },
  {
    title: "Ask the desk",
    body: "Our team can point you toward the right nearby stop.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rodeway Hub — Your Digital Front Desk" },
      {
        name: "description",
        content:
          "Send a room request once and we route it to the right person in under 10 minutes. Towels, housekeeping, repairs, and front-desk questions.",
      },
      { property: "og:title", content: "Rodeway Hub — Your Digital Front Desk" },
      {
        property: "og:description",
        content:
          "Guest requests, routed fast. Towels, housekeeping, repairs, and front-desk questions from your room.",
      },
    ],
  }),
  component: GuestView,
});

function GuestView() {
  const [open, setOpen] = useState<(typeof REQUESTS)[number] | null>(null);
  const [room, setRoom] = useState("214");
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!open) return;
    const trimmedRoom = room.trim();
    if (!trimmedRoom || trimmedRoom.length > 10) {
      toast.error("Add a valid room number.");
      return;
    }
    if (details.length > 1000 || name.length > 80) {
      toast.error("That's a little too long — trim it down.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("requests").insert({
      room: trimmedRoom,
      guest_name: name.trim() || null,
      type: open.label,
      details: details.trim() || null,
    });
    setSending(false);
    if (error) {
      toast.error("We couldn't send that. Please call the front desk.");
      return;
    }
    toast.success("Sent. We're routing it now.");
    setDetails("");
    setOpen(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Your digital front desk
        </span>
        <Link
          to="/staff"
          className="text-xs uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Staff dashboard
        </Link>
      </header>

      <main>
        <section className="grid gap-10 px-6 pb-16 pt-6 md:grid-cols-2 md:items-end md:px-12">
          <div>
            <h1 className="max-w-xl text-5xl leading-[1.05] md:text-6xl">
              Good evening,{" "}
              <em className="text-primary">make yourself at home.</em>
            </h1>
            <p className="mt-6 max-w-md text-muted-foreground">
              Need something for the room? Send it once. We'll route it from here.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-1">
                Room 214
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Tonight, {today}
              </span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-border">
            <img
              src={roomDusk}
              alt="Motel room at dusk with warm lamp light and crisp white bedding"
              width={1600}
              height={1100}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-4 left-4 rounded-md bg-card/90 px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              Scan. Ask. Stay easy.
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 py-16 md:px-12">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Dispatch desk · Room 214
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl">Tell us what you need.</h2>
          <p className="mt-3 text-muted-foreground">
            We route each request to the right person{" "}
            <strong className="font-medium text-foreground">under 10 min</strong>
          </p>

          <ul className="mt-10 divide-y divide-border border-y border-border">
            {REQUESTS.map((request, index) => (
              <li key={request.id}>
                <button
                  type="button"
                  onClick={() => setOpen(request)}
                  className="group flex w-full items-center gap-6 py-6 text-left transition-colors hover:bg-secondary/60"
                >
                  <span className="w-10 shrink-0 pl-1 text-xs tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    <span className="block text-xl">{request.label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {request.blurb}
                    </span>
                  </span>
                  <span className="pr-1 text-xs uppercase tracking-[0.18em] text-muted-foreground group-hover:text-primary">
                    Route request →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-6 rounded-lg border border-border bg-secondary/60 px-6 py-12 md:mx-12 md:px-12">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Revenue signal
          </p>
          <h2 className="mt-4 max-w-lg text-3xl md:text-4xl">
            Extend your stay by an hour.
          </h2>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Enjoy a slower morning with 1:00 PM checkout, subject to availability.
          </p>
          <Button
            className="mt-6"
            onClick={() =>
              setOpen({
                id: "late-checkout",
                label: "Ask about late checkout",
                blurb: "Subject to availability",
                prompt: "Which time works best for your morning?",
              })
            }
          >
            Ask about late checkout
          </Button>
        </section>

        <section className="px-6 py-16 md:px-12">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Nearby, on purpose
          </p>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-4xl md:text-5xl">Good stops around here.</h2>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Open property map
            </a>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STOPS.map((stop, index) => (
              <article
                key={stop.title}
                className="rounded-lg border border-border bg-card p-6"
              >
                <span className="text-xs tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-xl">{stop.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{stop.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border px-6 py-16 md:px-12">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Stay connected
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl">Need a hand?</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border p-6 transition-colors hover:bg-secondary/60"
            >
              <span className="text-xs tabular-nums text-muted-foreground">01</span>
              <h3 className="mt-3 text-xl">Find us</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                2224 W. County Road 48
                <br />
                Bushnell, FL 33513, US
              </p>
            </a>
            <a
              href="tel:+13527935010"
              className="rounded-lg border border-border p-6 transition-colors hover:bg-secondary/60"
            >
              <span className="text-xs tabular-nums text-muted-foreground">02</span>
              <h3 className="mt-3 text-xl">Call the front desk</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                (352) 793-5010
                <br />
                We're happy to help.
              </p>
            </a>
            <div className="rounded-lg border border-border p-6">
              <span className="text-xs tabular-nums text-muted-foreground">03</span>
              <h3 className="mt-3 text-xl">Wi-Fi access</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask the front desk for the current network name and password.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open?.label}</DialogTitle>
            <DialogDescription>{open?.prompt}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={room}
                  maxLength={10}
                  onChange={(event) => setRoom(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={name}
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                value={details}
                maxLength={1000}
                rows={4}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Anything we should know?"
              />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Sending…" : "Send request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

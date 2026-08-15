import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import roomDusk from "@/assets/room-dusk.jpg";
import { z } from "zod";

const requestSchema = z.object({
  room: z
    .string()
    .trim()
    .min(1, { message: "Room number is required." })
    .max(10, { message: "Room number must be 10 characters or less." }),
  guest_name: z
    .string()
    .trim()
    .max(80, { message: "Name must be less than 80 characters." }),
  details: z
    .string()
    .trim()
    .max(1000, { message: "Details must be less than 1000 characters." }),
});

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
          "Send a room request once and we route it to the right person in under 10 minutes. Towels, housekeeping, repairs, and front-desk questions.",
      },
      { property: "og:url", content: "https://rodewayinn.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://rodewayinn.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: "Rodeway Hub",
          url: "https://rodewayinn.lovable.app/",
          telephone: "+1-352-793-5010",
          address: {
            "@type": "PostalAddress",
            streetAddress: "2224 W. County Road 48",
            addressLocality: "Bushnell",
            addressRegion: "FL",
            postalCode: "33513",
            addressCountry: "US",
          },
        }),
      },
    ],
  }),

  component: GuestView,
});

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="signage flex items-center gap-2 text-muted-foreground">
      <span aria-hidden className="h-3 w-[3px] bg-amber" />
      {children}
    </p>
  );
}

function GuestView() {
  const [open, setOpen] = useState<(typeof REQUESTS)[number] | null>(null);
  const [room, setRoom] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!open) return;
    const parsed = requestSchema.safeParse({ room, guest_name: name, details });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message = issue?.message ?? "Please check your details.";
      if (issue?.path[0] === "room") setRoomError(message);
      toast.error(message);
      return;
    }
    setRoomError(null);
    setSending(true);
    const { error } = await supabase.from("requests").insert({
      room: parsed.data.room,
      guest_name: parsed.data.guest_name || null,
      type: open.label,
      details: parsed.data.details || null,
    });
    setSending(false);
    if (error) {
      if (error.code === "23514") {
        setRoomError("Enter a valid room number.");
        toast.error("Enter a valid room number.");
        return;
      }
      toast.error("We couldn't send that. Please call the front desk.");
      return;
    }
    toast.success("Sent. We're routing it now.", {
      description: "The front desk is notified and will follow up shortly.",
    });
    setDetails("");
    setOpen(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-12">
        <BrandLockup />
        <div className="flex items-center gap-4">
          <span className="signage hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-muted-foreground sm:flex">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" />
            Room 214
          </span>
          <Link
            to="/staff"
            className="signage text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
          >
            Staff
          </Link>
        </div>
      </header>

      <main>
        <section className="grid gap-10 px-6 pb-16 pt-12 md:grid-cols-[1.05fr_1fr] md:items-end md:px-12">
          <div>
            <Eyebrow>Your digital front desk</Eyebrow>
            <h1 className="mt-6 max-w-xl text-5xl leading-[1.04] md:text-6xl">
              Good evening,{" "}
              <em className="text-amber">make yourself at home.</em>
            </h1>
            <p className="mt-6 max-w-md text-muted-foreground">
              Need something for the room? Send it once. We'll route it from here.
            </p>
            <div className="signage mt-8 flex flex-wrap items-center gap-3 text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-1.5">
                Room 214
              </span>
              <span className="rounded-full border border-border px-3 py-1.5">
                Tonight{today ? `, ${today}` : ""}
              </span>
            </div>
          </div>
          <div className="relative overflow-hidden border border-ink/15">
            <img
              src={roomDusk}
              alt="Motel room at dusk with warm lamp light and crisp white bedding"
              width={1600}
              height={1100}
              className="h-full w-full object-cover"
            />
            <div className="signage absolute bottom-4 left-4 bg-ink px-4 py-2.5 text-cream">
              Scan. Ask. <span className="text-amber">Stay easy.</span>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 py-16 md:px-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Dispatch desk · Room 214</Eyebrow>
              <h2 className="mt-4 text-4xl md:text-5xl">Tell us what you need.</h2>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              We route each request to the right person{" "}
              <strong className="font-medium text-ink">under 10 min</strong>
            </p>
          </div>

          <ul className="mt-10 border-y border-border">
            {REQUESTS.map((request, index) => (
              <li key={request.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpen(request)}
                  className="group flex w-full items-center gap-6 py-6 pl-1 text-left transition-colors duration-200 hover:bg-ink/[0.04]"
                >
                  <span className="signage w-10 shrink-0 text-amber tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-xl">
                      {request.label}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {request.blurb}
                    </span>
                  </span>
                  <span className="signage pr-1 text-muted-foreground transition-colors duration-200 group-hover:text-ink">
                    Route request →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-6 flex flex-wrap items-center gap-8 bg-ink px-6 py-12 text-cream md:mx-12 md:px-12">
          <span className="font-display text-6xl leading-none text-amber">05</span>
          <div className="min-w-64 flex-1">
            <p className="signage flex items-center gap-2 text-cream/60">
              <span aria-hidden className="h-3 w-[3px] bg-amber" />
              Revenue signal
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl">
              Extend your stay by an hour.
            </h2>
            <p className="mt-2 max-w-lg text-sm text-cream/70">
              Enjoy a slower morning with 1:00 PM checkout, subject to availability.
            </p>
          </div>
          <Button
            className="bg-amber text-ink hover:bg-amber/90"
            onClick={() =>
              setOpen({
                id: "late-checkout",
                label: "Ask about late checkout",
                blurb: "Subject to availability",
                prompt: "Which time works best for your morning?",
              })
            }
          >
            Ask about late checkout ↗
          </Button>
        </section>

        <section className="px-6 py-16 md:px-12">
          <Eyebrow>Nearby, on purpose</Eyebrow>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-4xl md:text-5xl">Good stops around here.</h2>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="signage text-ink underline decoration-amber decoration-2 underline-offset-4"
            >
              Open property map ↗
            </a>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STOPS.map((stop, index) => (
              <article
                key={stop.title}
                className="border border-border bg-card p-6 transition-colors duration-200 hover:border-amber"
              >
                <span className="signage text-amber tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-xl">{stop.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{stop.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border px-6 py-16 md:px-12">
          <Eyebrow>Stay connected</Eyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl">Need a hand?</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="border border-border p-6 transition-colors duration-200 hover:border-amber"
            >
              <span className="signage text-amber tabular-nums">01</span>
              <h3 className="mt-3 text-xl">Find us</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                2224 W. County Road 48
                <br />
                Bushnell, FL 33513, US
              </p>
            </a>
            <a
              href="tel:+13527935010"
              className="border border-border p-6 transition-colors duration-200 hover:border-amber"
            >
              <span className="signage text-amber tabular-nums">02</span>
              <h3 className="mt-3 text-xl">Call the front desk</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                (352) 793-5010
                <br />
                We're happy to help.
              </p>
            </a>
            <div className="border border-border p-6">
              <span className="signage text-amber tabular-nums">03</span>
              <h3 className="mt-3 text-xl">Wi-Fi access</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask the front desk for the current network name and password.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-8 md:px-12">
        <BrandLockup />
        <p className="signage text-muted-foreground">
          Simple stays. Thoughtful service.
        </p>
      </footer>

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
                  placeholder="Your room number"
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/brand-lockup";
import { PropertyMap } from "@/components/property-map";
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
import propertyAsset from "@/assets/days-inn-property.webp.asset.json";
import exteriorAsset from "@/assets/unnamed-2.webp.asset.json";
import roomAsset from "@/assets/room.webp.asset.json";
import pool1Asset from "@/assets/unnamed_1.webp.asset.json";
import bathAsset from "@/assets/unnamed_2.webp.asset.json";
import pool2Asset from "@/assets/unnamed_3.webp.asset.json";
import lobbyAsset from "@/assets/unnamed_4.webp.asset.json";
import doubleAsset from "@/assets/unnamed_5.webp.asset.json";
import breakfastAsset from "@/assets/unnamed_6.webp.asset.json";
import suiteAsset from "@/assets/unnamed_8.webp.asset.json";
import deskAsset from "@/assets/unnamed_9.webp.asset.json";
import { requestSchema } from "@/lib/request-schema";
import {
  BOOKING_URL,
  FranchiseDisclaimer,
  FranchiseLegal,
} from "@/components/franchise-footer";

const REWARDS = [
  {
    title: "Wyndham Rewards® Member Rates",
    body: "Exclusive member-only pricing when you book direct through Wyndham.",
  },
  {
    title: "10 points per dollar",
    body: "Earn 10 points per dollar spent or 1,000 points on direct qualifying stays — whichever is more.",
  },
  {
    title: "Free Wi-Fi & Daybreak® breakfast",
    body: "Complimentary Wi-Fi property-wide plus Daybreak® breakfast, where available.",
  },
];

const GALLERY = [
  { src: exteriorAsset.url, alt: "Days Inn Wildwood exterior at dusk", caption: "Front entrance" },
  { src: roomAsset.url, alt: "Two queen beds with coastal artwork", caption: "Two queen room" },
  { src: doubleAsset.url, alt: "Guest room with two beds, desk and window", caption: "Room view" },
  { src: pool1Asset.url, alt: "Outdoor pool with lounge chairs and palm trees", caption: "Outdoor pool" },
  { src: pool2Asset.url, alt: "Pool deck beside the guest room building", caption: "Pool deck" },
  { src: lobbyAsset.url, alt: "Front desk in the lobby", caption: "Front desk" },
  { src: breakfastAsset.url, alt: "Breakfast counter with coffee and waffle makers", caption: "Breakfast area" },
  { src: suiteAsset.url, alt: "Suite sitting area with sofa, desk and TV", caption: "Suite sitting area" },
  { src: deskAsset.url, alt: "In-room work desk with fridge, microwave and TV", caption: "Work desk & kitchenette" },
  { src: bathAsset.url, alt: "Bathroom with tub and shower", caption: "Bath" },
];

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=28.872883,-82.093933";

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
      { title: "Days Inn Hub — Your Digital Front Desk" },
      {
        name: "description",
        content:
          "Send a room request once and we route it to the right person in under 10 minutes. Towels, housekeeping, repairs, and front-desk questions.",
      },
      { property: "og:title", content: "Days Inn Hub — Your Digital Front Desk" },
      {
        property: "og:description",
        content:
          "Send a room request once and we route it to the right person in under 10 minutes. Towels, housekeeping, repairs, and front-desk questions.",
      },
      { property: "og:url", content: "https://daysinn.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://daysinn.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: "Days Inn Hub",
          url: "https://daysinn.lovable.app/",
          telephone: "+1-352-748-7766",
          address: {
            "@type": "PostalAddress",
            streetAddress: "551 East SR 44",
            addressLocality: "Wildwood",
            addressRegion: "FL",
            postalCode: "34785",
            addressCountry: "US",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 28.872883,
            longitude: -82.093933,
          },
        }),
      },
    ],
  }),

  component: GuestView,
});

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
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-5 py-3 backdrop-blur md:px-10">
        <BrandLockup />
        <div className="flex items-center gap-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-amber px-4 py-2 text-xs font-bold text-ink shadow-sm transition-colors duration-200 hover:bg-ink hover:text-cream"
          >
            Book now
          </a>
          <Link
            to="/checkin"
            search={{}}
            className="rounded-full bg-ocean px-4 py-2 text-xs font-bold text-cream shadow-sm transition-colors duration-200 hover:bg-ink"
          >
            Sign in to your room
          </Link>
          <Link
            to="/staff"
            className="signage text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
          >
            Staff
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-14 md:px-8">
        {/* Hero */}
        <section className="relative mt-5 h-64 overflow-hidden rounded-3xl shadow-lg md:h-80">
          <img
            src={propertyAsset.url}
            alt="Days Inn Wildwood exterior at dusk with lit walkways"
            width={1600}
            height={1067}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/90 via-ink/25 to-transparent p-6 md:p-8">
            <p className="signage text-amber">
              Days Inn® by Wyndham Wildwood I-75
            </p>
            <h1 className="mt-2 text-3xl text-cream md:text-4xl">
              Good evening — make yourself at home.
            </h1>
            <p className="mt-2 max-w-lg text-sm text-cream/80">
              Tell us what you need. We route each request to the right person in
              under 10 minutes{today ? ` · Tonight, ${today}` : ""}.
            </p>
          </div>
        </section>

        {/* Quick request actions */}
        <section className="mt-9">
          <h2 className="signage mb-4 text-ink-soft">Quick guest services</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {REQUESTS.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => setOpen(request)}
                className="group flex flex-col items-start gap-2 rounded-2xl border-l-4 border-amber bg-card p-4 text-left shadow-sm transition-colors duration-200 hover:bg-ocean"
              >
                <span className="font-display text-sm font-semibold leading-snug text-ink group-hover:text-cream">
                  {request.label}
                </span>
                <span className="text-xs text-muted-foreground group-hover:text-cream/75">
                  {request.blurb}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Late checkout */}
        <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink p-6 text-cream shadow-lg">
          <div>
            <p className="signage text-amber">Stay longer</p>
            <h2 className="mt-2 text-2xl text-cream">Extend your stay by an hour.</h2>
            <p className="mt-1 text-sm text-cream/70">
              Enjoy a slower morning with 1:00 PM checkout, subject to availability.
            </p>
          </div>
          <Button
            className="rounded-xl bg-ocean font-bold text-cream hover:bg-amber hover:text-ink"
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

        {/* Nearby stops */}
        <section className="mt-9">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="signage text-ink-soft">Nearby stops</h2>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-ocean underline underline-offset-4"
            >
              Open property map ↗
            </a>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {STOPS.map((stop) => (
              <article
                key={stop.title}
                className="rounded-2xl bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <h3 className="text-base text-ink">{stop.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{stop.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section className="mt-9">
          <h2 className="signage mb-4 text-ink-soft">Property gallery</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {GALLERY.map((photo, index) => (
              <figure
                key={photo.src}
                className={`group relative overflow-hidden rounded-2xl ${
                  index === 0 ? "col-span-2 row-span-2" : ""
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    index === 0 ? "h-52 md:h-full md:min-h-[16.5rem]" : "h-32"
                  }`}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-cream">
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Wyndham Rewards */}
        <section className="mt-9 rounded-3xl bg-ink p-6 text-cream shadow-lg md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="signage text-amber">Wyndham Rewards® Member Benefits</p>
              <h2 className="mt-2 text-2xl text-cream">
                Book direct. Earn more on every stay.
              </h2>
            </div>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-amber px-5 py-3 text-sm font-bold text-ink transition-colors duration-200 hover:bg-cream"
            >
              Check rates ↗
            </a>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {REWARDS.map((perk) => (
              <article
                key={perk.title}
                className="rounded-2xl border-l-4 border-amber bg-cream/10 p-4"
              >
                <h3 className="text-base text-cream">{perk.title}</h3>
                <p className="mt-1.5 text-sm text-cream/75">{perk.body}</p>
              </article>
            ))}
          </div>
          <FranchiseDisclaimer className="mt-4 text-[11px] leading-relaxed text-cream/60" />
        </section>

        {/* Map & directions */}
        <PropertyMap />

        {/* Contact */}
        <section className="mt-9 grid gap-3 rounded-3xl bg-card p-6 shadow-sm md:grid-cols-3 md:items-center">
          <a href={MAP_URL} target="_blank" rel="noreferrer" className="block">
            <p className="signage text-ocean">Find us</p>
            <p className="mt-1.5 text-sm font-bold text-ink">551 East SR 44</p>
            <p className="text-xs text-muted-foreground">Wildwood, FL 34785, US</p>
          </a>
          <div>
            <p className="signage text-ocean">Wi-Fi access</p>
            <p className="mt-1.5 text-sm font-bold text-ink">Ask the front desk</p>
            <p className="text-xs text-muted-foreground">
              We'll share the current network and password.
            </p>
          </div>
          <a
            href="tel:+13527487766"
            className="flex items-center justify-center rounded-2xl bg-ocean px-5 py-3 text-sm font-bold text-cream shadow-md transition-colors duration-200 hover:bg-ink"
          >
            Call front desk · (352) 748-7766
          </a>
        </section>
      </main>

      <footer className="mt-4 space-y-4 border-t border-border px-5 py-6 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandLockup />
          <p className="signage text-muted-foreground">
            Simple stays. Thoughtful service.
          </p>
        </div>
        <FranchiseLegal />
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
                  aria-invalid={roomError ? true : undefined}
                  aria-describedby={roomError ? "room-error" : undefined}
                  onChange={(event) => {
                    setRoom(event.target.value);
                    if (roomError) setRoomError(null);
                  }}
                  required
                />
                {roomError ? (
                  <p id="room-error" className="text-xs text-destructive">
                    {roomError}
                  </p>
                ) : null}
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/brand-lockup";
import { PropertyMap } from "@/components/property-map";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Sparkles,
  Wrench,
  MessageSquare,
  Clock,
  MapPin,
  Wifi,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BedDouble,
} from "lucide-react";
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
import { BOOKING_URL, FranchiseDisclaimer, FranchiseLegal } from "@/components/franchise-footer";

const REWARDS = [
  {
    title: "Wyndham Rewards® Member Rates",
    body: "Exclusive member-only pricing when you book direct through Wyndham.",
    badge: "Best Rate Guarantee",
  },
  {
    title: "10 Points Per Dollar",
    body: "Earn 10 points per dollar spent or 1,000 points on direct qualifying stays — whichever is more.",
    badge: "Direct Bookings",
  },
  {
    title: "Free Wi-Fi & Daybreak® Breakfast",
    body: "Complimentary high-speed Wi-Fi property-wide plus hot Daybreak® breakfast daily.",
    badge: "Complimentary",
  },
];

const GALLERY = [
  {
    src: exteriorAsset.url,
    alt: "Days Inn Wildwood exterior at dusk",
    caption: "Front Entrance & Walkway",
  },
  {
    src: roomAsset.url,
    alt: "Two queen beds with coastal artwork",
    caption: "Two Queen Guest Room",
  },
  {
    src: doubleAsset.url,
    alt: "Guest room with two beds, desk and window",
    caption: "Executive Room View",
  },
  {
    src: pool1Asset.url,
    alt: "Outdoor pool with lounge chairs and palm trees",
    caption: "Outdoor Heated Pool",
  },
  {
    src: pool2Asset.url,
    alt: "Pool deck beside the guest room building",
    caption: "Sunny Pool Deck",
  },
  { src: lobbyAsset.url, alt: "Front desk in the lobby", caption: "Guest Welcome Lobby" },
  {
    src: breakfastAsset.url,
    alt: "Breakfast counter with coffee and waffle makers",
    caption: "Daybreak® Breakfast",
  },
  {
    src: suiteAsset.url,
    alt: "Suite sitting area with sofa, desk and TV",
    caption: "Hospitality Suite",
  },
  {
    src: deskAsset.url,
    alt: "In-room work desk with fridge, microwave and TV",
    caption: "Workstation & Kitchenette",
  },
  { src: bathAsset.url, alt: "Bathroom with tub and shower", caption: "Spacious En-Suite Bath" },
];

const MAP_URL = "https://www.google.com/maps/search/?api=1&query=28.872883,-82.093933";

const REQUESTS = [
  {
    id: "towels",
    label: "Fresh Towels & Linens",
    blurb: "Bath towels, washcloths, extra pillows",
    prompt: "How many towels or linens do you need?",
    icon: Sparkles,
  },
  {
    id: "housekeeping",
    label: "Housekeeping Refresh",
    blurb: "Room tidy, trash removal & amenities",
    prompt: "Tell us the best time to stop by your room.",
    icon: BedDouble,
  },
  {
    id: "problem",
    label: "Maintenance & Repairs",
    blurb: "Fast repair dispatch to your room",
    prompt: "What needs attention in your room?",
    icon: Wrench,
  },
  {
    id: "front-desk",
    label: "Front Desk Assistance",
    blurb: "Direct messaging with our front team",
    prompt: "How can our desk staff assist you right now?",
    icon: MessageSquare,
  },
];

const STOPS = [
  {
    title: "Breakfast & Coffee",
    body: "Complimentary Daybreak® breakfast in the lobby, plus local diner options nearby.",
    category: "Dining",
  },
  {
    title: "Fuel & Travel Essentials",
    body: "Convenient I-75 service stations, travel convenience stores, and ATM access.",
    category: "Convenience",
  },
  {
    title: "Local Attractions & Dining",
    body: "Ask our front desk for curated recommendations in Wildwood and The Villages.",
    category: "Explore",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Days Inn® by Wyndham Wildwood I-75 — Digital Front Desk & Guest Services" },
      {
        name: "description",
        content:
          "Send room requests directly to our team in under 10 minutes. Towels, housekeeping, repairs, late checkout, and local recommendations.",
      },
      {
        property: "og:title",
        content: "Days Inn® by Wyndham Wildwood I-75 — Digital Front Desk & Guest Services",
      },
      {
        property: "og:description",
        content:
          "Send room requests directly to our team in under 10 minutes. Towels, housekeeping, repairs, late checkout, and local recommendations.",
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
  const [open, setOpen] = useState<
    (typeof REQUESTS)[number] | { id: string; label: string; prompt: string } | null
  >(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [room, setRoom] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
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
      description: "Our staff has been notified and will fulfill your request promptly.",
    });
    setDetails("");
    setOpen(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber/30 selection:text-ink">
      {/* Sticky Liquid Glass Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 px-4 py-3.5 backdrop-blur-xl transition-all duration-200 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <BrandLockup />
          </div>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="spring-hover inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-sm hover:brightness-105"
            >
              Book direct ↗
            </a>
            <Link
              to="/checkin"
              search={{}}
              className="spring-hover hidden rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-110 sm:inline-flex"
            >
              Sign in to room
            </Link>
            <Link
              to="/guide"
              className="signage hidden text-muted-foreground transition-colors duration-200 hover:text-primary sm:inline-flex"
            >
              Local guide
            </Link>
            <Link
              to="/track"
              className="signage hidden text-muted-foreground transition-colors duration-200 hover:text-primary sm:inline-flex"
            >
              Track request
            </Link>
            <Link
              to="/staff"
              className="signage hidden text-muted-foreground transition-colors duration-200 hover:text-primary sm:inline-flex"
            >
              Staff
            </Link>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card/60 text-foreground backdrop-blur sm:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[82vw] max-w-xs border-l border-border/80 bg-background/95 backdrop-blur-2xl"
              >
                <SheetHeader>
                  <SheetTitle className="text-left font-serif text-lg text-foreground">
                    Guest Navigation
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-3">
                  <Link
                    to="/checkin"
                    search={{}}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm"
                  >
                    Sign in to your room
                  </Link>
                  <a
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl bg-accent px-4 py-3 text-center text-sm font-bold text-accent-foreground shadow-sm"
                  >
                    Book direct rates
                  </a>
                  <Link
                    to="/room"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-border/80 bg-card px-4 py-3 text-center text-sm font-semibold text-foreground"
                  >
                    In-room guest hub
                  </Link>
                  <Link
                    to="/guide"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-border/80 bg-card px-4 py-3 text-center text-sm font-semibold text-foreground"
                  >
                    Local area guide
                  </Link>
                  <Link
                    to="/track"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-border/80 bg-card px-4 py-3 text-center text-sm font-semibold text-foreground"
                  >
                    Track a request
                  </Link>
                  <Link
                    to="/staff"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-border/80 bg-card px-4 py-3 text-center text-sm font-semibold text-foreground"
                  >
                    Staff portal
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 md:px-8">
        <PwaInstallPrompt className="mb-6" />

        {/* Hero Section with Liquid Glass Treatment */}
        <section className="glass-hero relative mt-6 h-72 overflow-hidden rounded-3xl border border-white/20 shadow-xl md:h-96">
          <img
            src={propertyAsset.url}
            alt="Days Inn Wildwood exterior at dusk with lit walkways"
            width={1600}
            height={1067}
            className="h-full w-full object-cover brightness-[0.88] transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 text-[11px] font-bold tracking-wider text-amber backdrop-blur-md border border-amber/30 uppercase">
                <Sparkles className="h-3 w-3" />
                Days Inn® by Wyndham Wildwood I-75
              </span>
              {today ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
                  {today}
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white md:text-5xl">
              Welcome — Make yourself at home.
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-200/90 md:text-base">
              Send an in-room request anytime. Our on-site hospitality team routes and responds in
              under 10 minutes.
            </p>
          </div>
        </section>

        {/* Quick Request Cards */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="signage text-accent font-bold">In-Room Guest Concierge</p>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Instant Room Services
              </h2>
            </div>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
              <Clock className="h-3.5 w-3.5 text-accent" />
              10-min average response
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {REQUESTS.map((request) => {
              const Icon = request.icon;
              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setOpen(request)}
                  className="glass-card group flex flex-col justify-between rounded-2xl p-5 text-left transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                      Request →
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-serif text-base font-bold text-foreground">
                      {request.label}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {request.blurb}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Late Checkout Luxury Card */}
        <section className="relative mt-8 overflow-hidden rounded-3xl border border-blue-900/30 bg-[#1E3A8A] p-7 text-white shadow-xl md:p-9">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-200 border border-accent/40">
                <Clock className="h-3 w-3" /> Extended Departure
              </span>
              <h2 className="mt-2.5 font-serif text-2xl font-bold text-white md:text-3xl">
                Need a slower morning?
              </h2>
              <p className="mt-1.5 text-sm text-slate-200/90 leading-relaxed">
                Request a 1:00 PM late checkout so you can rest and recharge before heading out
                (subject to availability).
              </p>
            </div>

            <Button
              className="spring-hover rounded-xl bg-accent px-5 py-2.5 font-bold text-accent-foreground shadow-md hover:brightness-105"
              onClick={() =>
                setOpen({
                  id: "late-checkout",
                  label: "Request Late Checkout",
                  prompt: "What time would you prefer to depart tomorrow?",
                })
              }
            >
              Ask about late checkout ↗
            </Button>
          </div>
        </section>

        {/* Nearby Stops & Area Tips */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="signage text-accent font-bold">Local Convenience</p>
              <h2 className="font-serif text-xl font-bold text-foreground">Nearby Highlights</h2>
            </div>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline underline-offset-4"
            >
              <MapPin className="h-3.5 w-3.5" />
              Open property map ↗
            </a>
          </div>

          <div className="grid gap-3.5 md:grid-cols-3">
            {STOPS.map((stop) => (
              <article key={stop.title} className="glass-card rounded-2xl p-5">
                <span className="signage text-[10px] text-muted-foreground">{stop.category}</span>
                <h3 className="mt-1 font-serif text-base font-bold text-foreground">
                  {stop.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{stop.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Property Gallery */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="signage text-accent font-bold">Explore Our Grounds</p>
            <h2 className="font-serif text-xl font-bold text-foreground">
              Property & Amenities Gallery
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {GALLERY.map((photo, index) => (
              <figure
                key={photo.src}
                className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ${
                  index === 0 ? "col-span-2 row-span-2" : ""
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    index === 0 ? "h-56 md:h-full md:min-h-[17.5rem]" : "h-36"
                  }`}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-3 text-[11px] font-semibold text-white backdrop-blur-[2px]">
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Wyndham Rewards Perks */}
        <section className="relative mt-10 rounded-3xl border border-slate-800 bg-[#0f172a] p-7 text-white shadow-xl md:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber">
                <ShieldCheck className="h-3.5 w-3.5" /> Wyndham Rewards® Member Benefits
              </span>
              <h2 className="mt-2 font-serif text-2xl font-bold text-white md:text-3xl">
                Book direct. Earn points on every stay.
              </h2>
            </div>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="spring-hover rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground shadow-md hover:brightness-105"
            >
              Check direct rates ↗
            </a>
          </div>

          <div className="mt-6 grid gap-3.5 md:grid-cols-3">
            {REWARDS.map((perk) => (
              <article
                key={perk.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
              >
                <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-amber">
                  {perk.badge}
                </span>
                <h3 className="mt-2.5 font-serif text-base font-bold text-white">{perk.title}</h3>
                <p className="mt-1.5 text-xs text-slate-300/80 leading-relaxed">{perk.body}</p>
              </article>
            ))}
          </div>
          <FranchiseDisclaimer className="mt-5 text-[11px] leading-relaxed text-slate-400" />
        </section>

        {/* Interactive Property Map */}
        <PropertyMap />

        {/* Contact & Amenities Information */}
        <section className="glass-card mt-10 grid gap-4 rounded-3xl p-6 md:grid-cols-3 md:items-center">
          <a href={MAP_URL} target="_blank" rel="noreferrer" className="block group">
            <p className="signage text-primary font-bold">Property Location</p>
            <p className="mt-1 font-serif text-base font-bold text-foreground group-hover:text-primary transition-colors">
              551 East SR 44
            </p>
            <p className="text-xs text-muted-foreground">
              Wildwood, FL 34785 (Right off I-75 Exit 329)
            </p>
          </a>

          <div>
            <p className="signage text-primary font-bold">Complimentary Wi-Fi</p>
            <p className="mt-1 font-serif text-base font-bold text-foreground">
              High-Speed Guest Network
            </p>
            <p className="text-xs text-muted-foreground">
              Connect to <strong className="text-foreground">DaysInn_Guest</strong> (No password
              needed).
            </p>
          </div>

          <a
            href="tel:+13527487766"
            className="spring-hover flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-xs font-bold text-primary-foreground shadow-md hover:brightness-110"
          >
            <Phone className="h-4 w-4 text-amber" />
            Front Desk · (352) 748-7766
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-border/80 bg-card/60 px-5 py-8 backdrop-blur md:px-10">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BrandLockup />
            <p className="signage text-muted-foreground">Warm hospitality · Effortless service</p>
          </div>
          <FranchiseLegal />
        </div>
      </footer>

      {/* Service Request Dialog Modal */}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="room" className="text-xs font-semibold text-foreground">
                  Room Number *
                </Label>
                <Input
                  id="room"
                  value={room}
                  placeholder="e.g. 214"
                  maxLength={10}
                  aria-invalid={roomError ? true : undefined}
                  aria-describedby={roomError ? "room-error" : undefined}
                  onChange={(event) => {
                    setRoom(event.target.value);
                    if (roomError) setRoomError(null);
                  }}
                  className="rounded-xl border-border bg-background/80"
                  required
                />
                {roomError ? (
                  <p id="room-error" className="text-[11px] text-destructive font-medium">
                    {roomError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                  Guest Name (Optional)
                </Label>
                <Input
                  id="name"
                  value={name}
                  maxLength={80}
                  placeholder="e.g. Smith"
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-xl border-border bg-background/80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="details" className="text-xs font-semibold text-foreground">
                Specific Requests or Details
              </Label>
              <Textarea
                id="details"
                value={details}
                maxLength={1000}
                rows={3}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Let us know how many items, preferred timing, or special notes..."
                className="rounded-xl border-border bg-background/80"
              />
            </div>

            <Button
              type="submit"
              className="spring-hover w-full rounded-xl bg-accent font-bold text-accent-foreground shadow-md hover:brightness-105"
              disabled={sending}
            >
              {sending ? "Routing request…" : "Send to front desk"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { ArrowRight, CheckCircle2, Clock, MapPin, Wifi } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  AMENITIES,
  FAQS,
  GALLERY,
  MAP_URL,
  POLICIES,
  REQUESTS,
  ROOM_TYPES,
  STOPS,
  type ServiceRequest,
} from "./content";

/** Small shared section heading: eyebrow + title. */
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="signage font-bold text-accent">{eyebrow}</p>
      <h2 className="font-serif text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

export function RoomTypesSection({ bookingLink }: { bookingLink: (roomType?: string) => string }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <SectionHeading eyebrow="Choose Your Room" title="Rooms & Sleeping Options" />
        <a
          href={bookingLink()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary underline-offset-4 hover:underline"
        >
          See live rates <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid gap-3.5 md:grid-cols-3">
        {ROOM_TYPES.map((roomType) => (
          <article
            key={roomType.name}
            className="glass-card overflow-hidden rounded-2xl transition-all duration-200"
          >
            <img
              src={roomType.image}
              alt={roomType.alt}
              loading="lazy"
              className="h-40 w-full object-cover"
            />
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-base font-bold text-foreground">{roomType.name}</h3>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {roomType.sleeps}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-accent">{roomType.beds}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {roomType.body}
              </p>
              <a
                href={bookingLink(roomType.key)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary underline-offset-4 hover:underline"
              >
                Check rates ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AmenitiesAndPolicies() {
  return (
    <section className="mt-10 grid gap-3.5 md:grid-cols-2">
      <div className="glass-card rounded-3xl p-6">
        <SectionHeading eyebrow="Included With Every Stay" title="Amenities" />
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {AMENITIES.map((amenity) => (
            <li
              key={amenity}
              className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              {amenity}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <SectionHeading eyebrow="Good To Know" title="Policies" />
        <dl className="mt-4 divide-y divide-border/70">
          {POLICIES.map((policy) => (
            <div key={policy.label} className="flex gap-4 py-2">
              <dt className="w-32 shrink-0 text-xs font-bold text-foreground">{policy.label}</dt>
              <dd className="text-xs leading-relaxed text-muted-foreground">{policy.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function GuestToolsSection({ onRequest }: { onRequest: (request: ServiceRequest) => void }) {
  return (
    <section className="mt-10 rounded-3xl border border-border/70 bg-card/50 p-5 md:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionHeading eyebrow="Already Staying With Us?" title="In-Room Requests & Guest Tools" />
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
              onClick={() => onRequest(request)}
              className="glass-card group flex flex-col justify-between rounded-2xl p-5 text-left transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-accent transition-transform group-hover:translate-x-0.5">
                  Request →
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-serif text-base font-bold text-foreground">{request.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {request.blurb}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/checkin"
          search={{}}
          className="spring-hover inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm"
        >
          Sign in to your room <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/track"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground"
        >
          Track a request
        </Link>
        <Link
          to="/guide"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground"
        >
          Local guide
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground">
          <Wifi className="h-3.5 w-3.5 text-accent" /> DaysInn_Guest Wi-Fi
        </span>
      </div>
    </section>
  );
}

export function LateCheckoutSection({
  onRequest,
}: {
  onRequest: (request: ServiceRequest) => void;
}) {
  return (
    <section className="relative mt-8 overflow-hidden rounded-3xl border border-blue-900/30 bg-[#1E3A8A] p-7 text-white shadow-xl md:p-9">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/25 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-200">
            <Clock className="h-3 w-3" /> Extended Departure
          </span>
          <h2 className="mt-2.5 font-serif text-2xl font-bold text-white md:text-3xl">
            Need a slower morning?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-200/90">
            Request a 1:00 PM late checkout so you can rest and recharge before heading out (subject
            to availability).
          </p>
        </div>

        <Button
          className="spring-hover rounded-xl bg-accent px-5 py-2.5 font-bold text-accent-foreground shadow-md hover:brightness-105"
          onClick={() =>
            onRequest({
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
  );
}

export function NearbyStopsSection() {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionHeading eyebrow="Local Convenience" title="Nearby Highlights" />
        <a
          href={MAP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary underline-offset-4 hover:underline"
        >
          <MapPin className="h-3.5 w-3.5" />
          Open property map ↗
        </a>
      </div>

      <div className="grid gap-3.5 md:grid-cols-3">
        {STOPS.map((stop) => (
          <article key={stop.title} className="glass-card rounded-2xl p-5">
            <span className="signage text-[10px] text-muted-foreground">{stop.category}</span>
            <h3 className="mt-1 font-serif text-base font-bold text-foreground">{stop.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{stop.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GallerySection() {
  return (
    <section className="mt-10">
      <div className="mb-4">
        <SectionHeading eyebrow="Explore Our Grounds" title="Property & Amenities Gallery" />
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
  );
}

export function FaqSection() {
  return (
    <section className="mt-10">
      <div className="mb-4">
        <SectionHeading eyebrow="Before You Book" title="Frequently Asked Questions" />
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        {FAQS.map((item) => (
          <article key={item.q} className="glass-card rounded-2xl p-5">
            <h3 className="font-serif text-base font-bold text-foreground">{item.q}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

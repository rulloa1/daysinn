import { ArrowRight, Check, Clock, Wifi } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  AMENITIES,
  FAQS,
  GALLERY,
  MAP_URL,
  POLICIES,
  ROOM_TYPES,
  STOPS,
  type ServiceRequest,
} from "./content";
import { GUEST_REQUEST_TYPES } from "@/lib/guest-requests";
import poolAsset from "@/assets/days-inn-property.webp.asset.json";

function SectionHeading({
  eyebrow,
  title,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  tone?: "light" | "dark";
}) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">{eyebrow}</p>
      <h2
        className={`font-serif text-2xl font-bold tracking-tight md:text-3xl ${
          tone === "dark" ? "text-white" : "text-[#004986]"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

export function RoomTypesSection({ bookingLink }: { bookingLink: (roomType?: string) => string }) {
  return (
    <section id="rooms" className="mt-16 scroll-mt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Choose Your Room" title="Rooms & Sleeping Options" />
        <a
          href={bookingLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0065AB] hover:underline"
        >
          See live rates ↗
        </a>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {ROOM_TYPES.map((roomType) => (
          <article
            key={roomType.name}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#D2DBE6] bg-[#F5F8FB] shadow-xs transition hover:border-[#004986] hover:shadow-md"
          >
            <img
              src={roomType.image}
              alt={roomType.alt}
              loading="lazy"
              className="h-48 w-full object-cover"
            />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-lg font-bold text-[#004986]">{roomType.name}</h3>
                <span className="rounded-full bg-[#E7EDF5] px-2.5 py-0.5 text-[11px] font-bold text-[#0065AB]">
                  {roomType.sleeps}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">{roomType.beds}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{roomType.body}</p>
              <a
                href={bookingLink(roomType.key)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0065AB] hover:underline"
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
    <section id="amenities" className="mt-16 scroll-mt-20 space-y-12">
      {/* Amenities 2-column layout */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] items-start">
        <div>
          <SectionHeading eyebrow="Included With Every Stay" title="Amenities" />
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#D2DBE6] shadow-sm">
            <img
              src={poolAsset.url}
              alt="Outdoor heated pool"
              className="h-64 w-full object-cover"
            />
          </div>
        </div>

        <div className="lg:pt-8">
          <ul className="grid gap-x-6 divide-y divide-[#C6D1DE] sm:grid-cols-2">
            {AMENITIES.map((amenity) => (
              <li
                key={amenity}
                className="flex items-center gap-3 py-3.5 text-xs font-semibold text-slate-700"
              >
                <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                {amenity}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Policies 6-card grid */}
      <div>
        <SectionHeading eyebrow="Good To Know" title="Policies" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POLICIES.map((policy) => (
            <div
              key={policy.label}
              className="rounded-2xl border border-[#D2DBE6] bg-[#F5F8FB] p-5 shadow-2xs"
            >
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {policy.label}
              </p>
              <p className="mt-2 text-sm font-bold text-[#004986]">{policy.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GuestToolsSection({ onRequest }: { onRequest: (request: ServiceRequest) => void }) {
  return (
    <section className="mt-16 -mx-5 overflow-hidden rounded-3xl bg-[#004986] p-6 text-white md:-mx-8 md:p-12 shadow-xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Already Staying With Us?"
          title="In-Room Requests & Guest Tools"
          tone="dark"
        />
        <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-xs text-white/90">
          <span className="h-2 w-2 rounded-full bg-[#34D399]" />
          10-min average response
        </span>
      </div>

      {/* 4 In-Room Request Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GUEST_REQUEST_TYPES.map((req) => (
          <button
            key={req.id}
            type="button"
            onClick={() =>
              onRequest({
                id: req.id as ServiceRequest["id"],
                label: req.name,
                blurb: req.description,
                prompt: `Tell us what you need for ${req.shortLabel.toLowerCase()}`,
                icon: Clock,
              })
            }
            className="flex flex-col justify-between rounded-2xl border border-white/18 bg-white/7 p-5 text-left transition hover:bg-white/12 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div>
              <h3 className="font-serif text-base font-bold text-white">{req.name}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">{req.description}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37]">
              Request →
            </span>
          </button>
        ))}
      </div>

      {/* Action Row */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/18 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/checkin"
            search={{}}
            className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#004986] shadow-sm transition hover:bg-[#D4AF37]/90"
          >
            Sign in to your room
          </Link>
          <Link
            to="/track"
            className="rounded-xl border border-white/35 bg-transparent px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Track a request
          </Link>
          <Link
            to="/guide"
            className="rounded-xl border border-white/35 bg-transparent px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Local guide
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/70">
          <Wifi className="h-4 w-4 text-[#D4AF37]" />
          <span>
            Wi-Fi: <strong className="text-white">Days Inn</strong> · password{" "}
            <strong className="text-white">Sunshine</strong>
          </span>
        </div>
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
    <section className="mt-8 rounded-2xl border border-[#D2DBE6] bg-[#F5F8FB] p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#B45309] uppercase">
            Extended Departure
          </p>
          <h3 className="mt-1 font-serif text-lg font-bold text-[#004986]">
            Need a slower morning?
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Subject to availability, complimentary late check-out up to 12:00 PM for Wyndham Rewards
            members.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onRequest({
              id: "checkout",
              label: "Late Checkout Request",
              blurb: "Request departure time extension",
              prompt: "What time would you like to depart?",
              icon: Clock,
            })
          }
          className="rounded-xl bg-[#004986] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#004986]/90"
        >
          Ask about late checkout ↗
        </button>
      </div>
    </section>
  );
}

export function NearbyStopsSection() {
  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Local Convenience" title="Nearby Highlights" />
        <a
          href={MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0065AB] hover:underline"
        >
          Open property map ↗
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STOPS.map((stop) => (
          <div
            key={stop.title}
            className="rounded-2xl border border-[#D2DBE6] border-l-4 border-l-[#D4AF37] bg-[#F5F8FB] p-5 shadow-2xs"
          >
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {stop.category}
            </p>
            <h3 className="mt-1 font-serif text-base font-bold text-[#004986]">{stop.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{stop.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GallerySection() {
  return (
    <section id="gallery" className="mt-16 scroll-mt-20">
      <SectionHeading eyebrow="Property Photos" title="Take a Look Around" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {GALLERY.map((img) => (
          <figure
            key={img.caption}
            className="overflow-hidden rounded-xl border border-[#D2DBE6] bg-[#C9D4E1] shadow-2xs"
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="h-36 w-full object-cover transition duration-200 hover:scale-105"
            />
            <figcaption className="p-2.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase truncate">
              {img.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="mt-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] items-start">
        <SectionHeading eyebrow="Before You Book" title="Frequently Asked Questions" />

        <dl className="divide-y divide-[#C6D1DE]">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-4">
              <dt className="text-sm font-bold text-[#004986]">{faq.q}</dt>
              <dd className="mt-2 text-xs leading-relaxed text-slate-600">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

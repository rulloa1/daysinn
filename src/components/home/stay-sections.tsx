import { ArrowRight, Check, Clock, Wifi } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  AMENITIES,
  FAQS,
  GALLERY,
  MAP_URL,
  POLICIES,
  POOL_PHOTO,
  POOL_PHOTO_ALT,
  REQUESTS,
  ROOM_TYPES,
  STOPS,
  type ServiceRequest,
} from "./content";
import { GUEST_REQUEST_TYPES } from "@/lib/guest-requests";
import poolAsset from "@/assets/days-inn-property.webp.asset.json";

/** Top rhythm shared by the sections that sit on the page canvas. */
const SECTION_TOP = "pt-[clamp(2.5rem,6vw,4.5rem)]";
/** Full-bleed colour bands carry their own vertical padding. */
const BAND = "mt-[clamp(2.5rem,6vw,4.5rem)] py-[clamp(2.5rem,6vw,4.5rem)]";

const OUTLINE_LINK =
  "rounded-[10px] border border-white/35 px-5 py-3.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-white/10";

/** Eyebrow + title, blue on the canvas and white on the colour bands. */
function SectionHeading({
  eyebrow,
  title,
  tone = "blue",
}: {
  eyebrow: string;
  title: string;
  tone?: "blue" | "cream";
}) {
  return (
    <div>
      <p className="gh-eyebrow">{eyebrow}</p>
      <h2
        className={`gh-heading mt-2.5 text-pretty ${tone === "cream" ? "text-white" : "text-[var(--gh-blue)]"}`}
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
    <section id="rooms" className={`gh-shell scroll-mt-24 ${SECTION_TOP}`}>
      <div className="flex flex-wrap items-end justify-between gap-5">
    <section id="rooms" className="mt-16 scroll-mt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Choose Your Room" title="Rooms & Sleeping Options" />
        <a
          href={bookingLink()}
          target="_blank"
          rel="noreferrer"
          className="signage font-bold text-[var(--gh-blue)] underline-offset-4 hover:underline"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0065AB] hover:underline"
        >
          See live rates ↗
        </a>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {ROOM_TYPES.map((roomType) => (
          <article key={roomType.name} className="gh-card flex flex-col overflow-hidden">
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
              className="block h-[220px] w-full object-cover"
            />
            <div className="flex flex-1 flex-col px-6 pb-6 pt-[22px]">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-[1.3rem] font-bold text-[var(--gh-blue)]">
                  {roomType.name}
                </h3>
                <span className="shrink-0 rounded-full bg-[var(--gh-chip)] px-[11px] py-[5px] text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--gh-link)]">
                  {roomType.sleeps}
                </span>
              </div>
              <p className="mt-2.5 text-[0.82rem] font-semibold text-[#64748b]">{roomType.beds}</p>
              <p className="mt-3 text-[0.92rem] leading-[1.55] text-[var(--gh-body)] text-pretty">
                {roomType.body}
              </p>
              <a
                href={bookingLink(roomType.key)}
                target="_blank"
                rel="noreferrer"
                className="signage mt-auto pt-5 font-bold text-[var(--gh-blue)] underline-offset-4 hover:underline"
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

export function AmenitiesSection() {
  return (
    <section id="amenities" className={`gh-shell scroll-mt-24 ${SECTION_TOP}`}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <div>
          <SectionHeading eyebrow="Included With Every Stay" title="Amenities" />
          <img
            src={POOL_PHOTO}
            alt={POOL_PHOTO_ALT}
            loading="lazy"
            className="mt-6 block h-[280px] w-full rounded-2xl object-cover"
          />
        </div>

        <ul className="grid list-none grid-cols-1 gap-x-6 gap-y-0.5 p-0 sm:grid-cols-2">
          {AMENITIES.map((amenity) => (
            <li
              key={amenity}
              className="flex items-center gap-3 border-b border-[var(--gh-rule)] py-[18px] text-[0.98rem] text-[var(--gh-body-strong)]"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--gh-gold)]" />
              {amenity}
            </li>
          ))}
        </ul>
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
    </section>
  );
}

export function PoliciesSection() {
  return (
    <section className={`gh-shell ${SECTION_TOP}`}>
      <SectionHeading eyebrow="Good To Know" title="Policies" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POLICIES.map((policy) => (
          <div
            key={policy.label}
            className="rounded-[14px] border border-[var(--gh-border)] bg-[var(--gh-surface)] px-[22px] py-5"
          >
            <p className="signage font-bold tracking-[0.16em] text-[var(--gh-muted)]">
              {policy.label}
            </p>
            <p className="mt-2.5 text-[1.02rem] font-semibold leading-[1.45] text-[var(--gh-blue)] text-pretty">
              {policy.value}
            </p>
          </div>
        ))}
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
    <section className={`bg-[var(--gh-blue)] ${BAND}`}>
      <div className="gh-shell">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            eyebrow="Already Staying With Us?"
            title="In-Room Requests & Guest Tools"
            tone="cream"
          />
          <span className="inline-flex items-center gap-2.5 rounded-full bg-white/12 px-4 py-2.5 text-[0.8rem] text-white/85">
            <span className="h-2 w-2 rounded-full bg-[#34d399]" />
            10-min average response
          </span>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REQUESTS.map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => onRequest(request)}
              className="spring-hover flex flex-col rounded-2xl border border-white/[0.18] bg-white/[0.07] px-[22px] pb-5 pt-[22px] text-left hover:bg-white/[0.12]"
            >
              <h3 className="text-[1.05rem] font-bold text-white text-pretty">{request.label}</h3>
              <p className="mt-2.5 text-[0.88rem] leading-[1.5] text-white/70">{request.blurb}</p>
              <span className="signage mt-auto pt-5 font-bold text-[var(--gh-gold)]">
                Request →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/checkin"
            search={{}}
            className="spring-hover rounded-[10px] bg-[var(--gh-gold)] px-5 py-3.5 text-[0.85rem] font-bold text-[var(--gh-blue)] shadow-sm"
          >
            Sign in to your room
          </Link>
          <Link to="/track" className={OUTLINE_LINK}>
            Track a request
          </Link>
          <Link to="/guide" className={OUTLINE_LINK}>
            Local guide
          </Link>
          <span className="text-[0.8rem] text-white/55 sm:ml-auto">DaysInn_Guest Wi-Fi</span>
        </div>

        <div className="mt-10 grid items-center gap-6 border-t border-white/[0.18] pt-9 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="gh-eyebrow">Extended Departure</p>
            <h3 className="mt-2.5 font-serif text-[1.5rem] font-bold text-white">
              Need a slower morning?
            </h3>
            <p className="mt-2.5 max-w-[44rem] text-[0.95rem] leading-relaxed text-white/75 text-pretty">
              Request a 1:00 PM late checkout so you can rest and recharge before heading out
              (subject to availability).
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onRequest({
                id: "late-checkout",
                label: "Request Late Checkout",
                prompt: "What time would you prefer to depart tomorrow?",
              })
            }
            className="spring-hover justify-self-start whitespace-nowrap rounded-[10px] bg-[var(--gh-gold)] px-[22px] py-3.5 text-[0.88rem] font-bold text-[var(--gh-blue)] shadow-sm"
          >
            Ask about late checkout ↗
          </button>
        </div>
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
    <section className={`gh-shell ${SECTION_TOP}`}>
      <div className="flex flex-wrap items-end justify-between gap-5">
    <section className="mt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Local Convenience" title="Nearby Highlights" />
        <a
          href={MAP_URL}
          target="_blank"
          rel="noreferrer"
          className="signage font-bold text-[var(--gh-blue)] underline-offset-4 hover:underline"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0065AB] hover:underline"
        >
          Open property map ↗
        </a>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {STOPS.map((stop) => (
          <article
            key={stop.title}
            className="rounded-[14px] border border-[var(--gh-border)] border-l-4 border-l-[var(--gh-gold)] bg-[var(--gh-surface)] px-6 py-[22px]"
          >
            <p className="signage font-bold tracking-[0.16em] text-[var(--gh-muted)]">
              {stop.category}
            </p>
            <h3 className="mt-2.5 font-serif text-[1.2rem] font-bold text-[var(--gh-blue)]">
              {stop.title}
            </h3>
            <p className="mt-2.5 text-[0.92rem] leading-[1.55] text-[var(--gh-body)] text-pretty">
              {stop.body}
            </p>
          </article>
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
    <section id="gallery" className={`gh-shell scroll-mt-24 ${SECTION_TOP}`}>
      <SectionHeading eyebrow="Explore Our Grounds" title="Property & Amenities Gallery" />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GALLERY.map((photo) => (
          <figure key={photo.src} className="m-0 overflow-hidden rounded-xl bg-[#c9d4e1]">
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
              className="block h-[150px] w-full object-cover"
            />
            <figcaption className="px-3 py-[11px] text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[var(--gh-body)]">
              {photo.caption}
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
    <section className={`gh-shell ${SECTION_TOP}`}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
        <SectionHeading eyebrow="Before You Book" title="Frequently Asked Questions" />

        <dl className="m-0">
          {FAQS.map((item) => (
            <div key={item.q} className="border-b border-[var(--gh-rule)] py-5">
              <dt className="text-[1.02rem] font-bold text-[var(--gh-blue)] text-pretty">
                {item.q}
              </dt>
              <dd className="mt-2.5 text-[0.94rem] leading-relaxed text-[var(--gh-body)] text-pretty">
                {item.a}
              </dd>
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

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
        className={`gh-heading mt-2.5 text-pretty ${
          tone === "cream" ? "text-white" : "text-[var(--gh-blue)]"
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
        <SectionHeading eyebrow="Choose Your Room" title="Rooms & Sleeping Options" />
        <a
          href={bookingLink()}
          target="_blank"
          rel="noreferrer"
          className="signage font-bold text-[var(--gh-blue)] underline-offset-4 hover:underline"
        >
          See live rates ↗
        </a>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {ROOM_TYPES.map((roomType) => (
          <article key={roomType.name} className="gh-card flex flex-col overflow-hidden">
            <img
              src={roomType.image}
              alt={roomType.alt}
              loading="lazy"
            decoding="async"
              className="block h-[220px] w-full object-cover"
            />
            <div className="flex flex-1 flex-col px-6 pt-[22px] pb-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-[1.3rem] font-bold text-[var(--gh-blue)]">
                  {roomType.name}
                </h3>
                <span className="shrink-0 rounded-full bg-[var(--gh-chip)] px-[11px] py-[5px] text-[0.68rem] font-bold tracking-[0.1em] text-[var(--gh-link)] uppercase">
                  {roomType.sleeps}
                </span>
              </div>
              <p className="mt-2.5 text-[0.82rem] font-semibold text-[#64748b]">{roomType.beds}</p>
              <p className="mt-3 text-[0.92rem] leading-[1.55] text-pretty text-[var(--gh-body)]">
                {roomType.body}
              </p>
              <a
                href={bookingLink(roomType.key)}
                target="_blank"
                rel="noreferrer"
                className="signage mt-auto pt-5 font-bold text-[var(--gh-blue)] underline-offset-4 hover:underline"
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
            decoding="async"
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
            <p className="mt-2.5 text-[1.02rem] leading-[1.45] font-semibold text-pretty text-[var(--gh-blue)]">
              {policy.value}
            </p>
          </div>
        ))}
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
              className="spring-hover flex flex-col rounded-2xl border border-white/[0.18] bg-white/[0.07] px-[22px] pt-[22px] pb-5 text-left hover:bg-white/[0.12]"
            >
              <h3 className="text-[1.05rem] font-bold text-pretty text-white">{request.label}</h3>
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
          <span className="text-[0.8rem] text-white/55 sm:ml-auto">Wi-Fi: Days Inn · Sunshine</span>
        </div>

        <div className="mt-10 grid items-center gap-6 border-t border-white/[0.18] pt-9 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="gh-eyebrow">Extended Departure</p>
            <h3 className="mt-2.5 font-serif text-[1.5rem] font-bold text-white">
              Need a slower morning?
            </h3>
            <p className="mt-2.5 max-w-[44rem] text-[0.95rem] leading-relaxed text-pretty text-white/75">
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
            className="spring-hover justify-self-start rounded-[10px] bg-[var(--gh-gold)] px-[22px] py-3.5 text-[0.88rem] font-bold whitespace-nowrap text-[var(--gh-blue)] shadow-sm"
          >
            Ask about late checkout ↗
          </button>
        </div>
      </div>
    </section>
  );
}

export function NearbyStopsSection() {
  return (
    <section className={`gh-shell ${SECTION_TOP}`}>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <SectionHeading eyebrow="Local Convenience" title="Nearby Highlights" />
        <a
          href={MAP_URL}
          target="_blank"
          rel="noreferrer"
          className="signage font-bold text-[var(--gh-blue)] underline-offset-4 hover:underline"
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
            <p className="mt-2.5 text-[0.92rem] leading-[1.55] text-pretty text-[var(--gh-body)]">
              {stop.body}
            </p>
          </article>
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
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
            decoding="async"
              className="block h-[150px] w-full object-cover"
            />
            <figcaption className="px-3 py-[11px] text-[0.72rem] font-semibold tracking-[0.1em] text-[var(--gh-body)] uppercase">
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
    <section className={`gh-shell ${SECTION_TOP}`}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
        <SectionHeading eyebrow="Before You Book" title="Frequently Asked Questions" />

        <dl className="m-0">
          {FAQS.map((item) => (
            <div key={item.q} className="border-b border-[var(--gh-rule)] py-5">
              <dt className="text-[1.02rem] font-bold text-pretty text-[var(--gh-blue)]">
                {item.q}
              </dt>
              <dd className="mt-2.5 text-[0.94rem] leading-relaxed text-pretty text-[var(--gh-body)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

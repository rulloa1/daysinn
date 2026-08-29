const LAT = 28.872883;
const LNG = -82.093933;
const ADDRESS = "551 East SR 44, Wildwood, FL 34785";
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${LAT},${LNG}`;

const DIRECTIONS = [
  {
    label: "Google Maps",
    href: `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`,
  },
  {
    label: "Apple Maps",
    href: `https://maps.apple.com/?daddr=${LAT},${LNG}&dirflg=d`,
  },
  {
    label: "Waze",
    href: `https://waze.com/ul?ll=${LAT},${LNG}&navigate=yes`,
  },
];

const ONSITE = [
  {
    title: "Outdoor Heated Swimming Pool",
    desc: "Centrally located courtyard pool with sun deck & lounge seating.",
    badge: "Courtyard",
  },
  {
    title: "Daybreak® Breakfast & Lobby",
    desc: "Complimentary morning breakfast, 24/7 hot coffee & guest registration.",
    badge: "Lobby",
  },
  {
    title: "Truck & RV Parking",
    desc: "Dedicated oversized vehicle, bus, and trailer parking on perimeter.",
    badge: "Free Parking",
  },
  {
    title: "Direct Guest Parking",
    desc: "Walkway-level parking in front of ground and second floor access stairs.",
    badge: "On-Site",
  },
];

const MICRO_LABEL = "text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[var(--gh-gold)]";

export function PropertyMap() {
  return (
    <section id="location" className="gh-shell scroll-mt-24 pt-[clamp(2.5rem,6vw,4.5rem)]">
      <p className="gh-eyebrow">Location &amp; Access</p>
      <h2 className="gh-heading mt-2.5 text-[var(--gh-blue)]">Getting to Days Inn® Wildwood</h2>

      <div className="mt-7 grid items-start gap-5 lg:grid-cols-2">
        <div className="gh-card px-7 py-[26px]">
          <p className="text-[1.05rem] font-bold text-[var(--gh-blue)]">
            Days Inn® by Wyndham Wildwood I-75
          </p>
          <address className="mt-1.5 text-[0.98rem] not-italic text-[var(--gh-body)]">
            {ADDRESS}
          </address>
          <p className="mt-4 text-[0.94rem] leading-relaxed text-[var(--gh-body)] text-pretty">
            Conveniently located directly off{" "}
            <strong className="text-[var(--gh-blue)]">I-75 Exit 329</strong> and Florida&apos;s
            Turnpike. Easy access to The Villages, local dining, fuel stations, and central Florida
            attractions.
          </p>

          <p className="signage mt-[26px] font-bold tracking-[0.16em] text-[var(--gh-muted)]">
            Turn-by-Turn GPS Navigation
          </p>
          <p className="mt-2 text-[0.9rem] text-[var(--gh-body)]">
            Open instant directions in your favorite navigation app:
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            {DIRECTIONS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="spring-hover rounded-[10px] border border-[var(--gh-field-border)] bg-white px-4 py-[11px] text-[0.85rem] font-semibold text-[var(--gh-blue)] shadow-sm"
              >
                {item.label} ↗
              </a>
            ))}
          </div>
          <p className="mt-5 text-[0.88rem] text-[#64748b]">
            Free on-site parking for all cars, SUVs, buses, RVs, and commercial trucks.
          </p>
        </div>

        <div>
          <p className="signage font-bold tracking-[0.16em] text-[var(--gh-muted)]">
            On-Site Highlights · Property Amenities
          </p>

          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            {ONSITE.map((item) => (
              <div
                key={item.title}
                className="rounded-[14px] border border-[var(--gh-border)] bg-[var(--gh-surface)] px-5 py-[18px]"
              >
                <p className={MICRO_LABEL}>{item.badge}</p>
                <h3 className="mt-2 text-[0.98rem] font-bold text-[var(--gh-blue)] text-pretty">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.86rem] leading-[1.5] text-[var(--gh-body)] text-pretty">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="spring-hover block rounded-[14px] border border-[var(--gh-border)] bg-[var(--gh-blue)] px-5 py-[18px] text-white"
            >
              <span className={`block ${MICRO_LABEL}`}>Property Location</span>
              <span className="mt-2 block text-[0.94rem] font-semibold">{ADDRESS}</span>
              <span className="mt-1.5 block text-[0.82rem] text-white/70">
                (Right off I-75 Exit 329)
              </span>
            </a>

            <div className="rounded-[14px] border border-[var(--gh-border)] bg-[var(--gh-surface)] px-5 py-[18px]">
              <p className={MICRO_LABEL}>Complimentary Wi-Fi</p>
              <p className="mt-2 text-[0.94rem] font-bold text-[var(--gh-blue)]">
                High-Speed Guest Network
              </p>
              <p className="mt-2 text-[0.86rem] leading-[1.5] text-[var(--gh-body)]">
                Connect to <strong className="text-[var(--gh-blue)]">Days Inn</strong> — password{" "}
                <strong className="text-[var(--gh-blue)]">Sunshine</strong>.
              </p>
              <a
                href="tel:+13527487766"
                className="mt-3 inline-block text-[0.85rem] font-bold text-[var(--gh-link)] underline-offset-4 hover:underline"
              >
                Front Desk · (352) 748-7766
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { MapPin, Navigation, Waves, Coffee, Truck, Car } from "lucide-react";

const LAT = 28.872883;
const LNG = -82.093933;
const ADDRESS = "551 East SR 44, Wildwood, FL 34785";

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

const AMENITIES = [
  {
    icon: Waves,
    title: "Outdoor Heated Swimming Pool",
    desc: "Centrally located courtyard pool with sun deck & lounge seating.",
    badge: "Courtyard",
  },
  {
    icon: Coffee,
    title: "Daybreak® Breakfast & Lobby",
    desc: "Complimentary morning breakfast, 24/7 hot coffee & guest registration.",
    badge: "Lobby",
  },
  {
    icon: Truck,
    title: "Truck & RV Parking",
    desc: "Dedicated oversized vehicle, bus, and trailer parking on perimeter.",
    badge: "Free Parking",
  },
  {
    icon: Car,
    title: "Direct Guest Parking",
    desc: "Walkway-level parking in front of ground and second floor access stairs.",
    badge: "On-Site",
  },
];

export function PropertyMap() {
  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg">
      <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
        {/* Location & Navigation Card */}
        <div className="flex flex-col justify-between bg-muted/20 p-6 md:p-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="signage text-accent font-bold">Location & Access</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-foreground md:text-3xl">
              Getting to Days Inn® Wildwood
            </h2>
            <address className="mt-2 not-italic text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Days Inn® by Wyndham Wildwood I-75</strong>
              <br />
              {ADDRESS}
            </address>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Conveniently located directly off <strong className="text-foreground">I-75 Exit 329</strong> and Florida&apos;s Turnpike. Easy access to The Villages, local dining, fuel stations, and central Florida attractions.
            </p>
          </div>

          <div className="mt-8 border-t border-border/70 pt-6">
            <span className="signage text-primary font-bold">Turn-by-Turn GPS Navigation</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Open instant directions in your favorite navigation app:
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {DIRECTIONS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="spring-hover inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-bold text-foreground shadow-sm hover:border-primary/40 hover:bg-primary/5"
                >
                  <Navigation className="h-3.5 w-3.5 text-primary" />
                  {item.label} ↗
                </a>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Free on-site parking for all cars, SUVs, buses, RVs, and commercial trucks.
            </p>
          </div>
        </div>

        {/* Property Highlights */}
        <div className="border-t border-border/80 p-6 lg:border-t-0 lg:border-l md:p-8">
          <span className="signage text-accent font-bold">On-Site Highlights</span>
          <h3 className="mt-1 font-serif text-xl font-bold text-foreground">Property Amenities</h3>

          <div className="mt-5 space-y-3.5">
            {AMENITIES.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-serif text-xs font-bold text-foreground">{item.title}</h4>
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold text-amber">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

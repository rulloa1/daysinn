import { useState } from "react";
import { MapPin, Navigation, Clock, ExternalLink, Sparkles, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ATTRACTIONS, MAP_URL, type Attraction } from "./content";

export function AttractionsGuideSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "The Villages", "Dining", "Nature & Springs", "Travel & Transit"];

  const filteredAttractions =
    selectedCategory === "All"
      ? ATTRACTIONS
      : ATTRACTIONS.filter((a) => a.category === selectedCategory);

  return (
    <section id="location" className="gh-shell scroll-mt-24 pt-[clamp(2.5rem,6vw,4.5rem)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="gh-eyebrow flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--gh-gold)]" />
            Explore The Area
          </p>
          <h2 className="gh-heading mt-2 text-[var(--gh-blue)]">
            Nearby Highlights &amp; Driving Times
          </h2>
          <p className="mt-2 max-w-2xl text-[0.95rem] text-[var(--gh-body)]">
            Located off I-75 Exit 329, just 8–10 minutes from Brownwood Paddock Square and convenient
            to Florida's top natural springs and travel corridors.
          </p>
        </div>

        <a
          href={MAP_URL}
          target="_blank"
          rel="noreferrer"
          className="signage flex items-center gap-1.5 font-bold text-[var(--gh-blue)] underline-offset-4 hover:underline"
        >
          <Compass className="h-4 w-4 text-[var(--gh-gold)]" />
          Open live Google map ↗
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="mt-7 flex flex-wrap items-center gap-2 border-b border-[var(--gh-border)] pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedCategory === cat
                ? "bg-[var(--gh-blue)] text-white shadow-sm"
                : "border border-transparent bg-white/70 text-[var(--gh-body-strong)] hover:border-[var(--gh-border)] hover:bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Attractions Grid */}
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredAttractions.map((spot) => (
          <article
            key={spot.title}
            className="gh-card group flex flex-col justify-between overflow-hidden bg-white p-6 transition-all duration-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="signage font-bold tracking-[0.14em] text-[var(--gh-muted)]">
                  {spot.category}
                </span>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    <Clock className="h-3 w-3" />
                    {spot.driveTime}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">({spot.distance})</span>
                </div>
              </div>

              <h3 className="mt-3 font-serif text-[1.22rem] font-bold text-[var(--gh-blue)] group-hover:text-[var(--gh-link)] transition-colors">
                {spot.title}
              </h3>

              {spot.highlight && (
                <div className="mt-2">
                  <Badge className="bg-[var(--gh-chip)] text-[10px] font-bold text-[var(--gh-link)] hover:bg-[var(--gh-chip)]">
                    <Sparkles className="mr-1 h-3 w-3 text-[var(--gh-gold)]" />
                    {spot.highlight}
                  </Badge>
                </div>
              )}

              <p className="mt-3 text-[0.9rem] leading-relaxed text-[var(--gh-body)]">{spot.body}</p>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${spot.mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--gh-blue)] hover:text-[var(--gh-gold)] transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                Get Driving Directions ↗
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Property Address & Contact Bar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--gh-border)] bg-[var(--gh-surface)] p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gh-blue)] text-white shrink-0">
            <MapPin className="h-5 w-5 text-[var(--gh-gold)]" />
          </span>
          <div>
            <p className="font-serif text-sm font-bold text-[var(--gh-blue)]">
              Days Inn by Wyndham Wildwood I-75
            </p>
            <p className="text-xs text-slate-600">
              551 East SR 44, Wildwood, FL 34785 · Exit 329 at I-75 &amp; SR 44
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:+13527487766"
            className="spring-hover rounded-xl border border-[var(--gh-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--gh-blue)] shadow-xs hover:bg-slate-50"
          >
            Call (352) 748-7766
          </a>
          <a
            href={MAP_URL}
            target="_blank"
            rel="noreferrer"
            className="spring-hover rounded-xl bg-[var(--gh-blue)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110"
          >
            GPS Navigation ↗
          </a>
        </div>
      </div>
    </section>
  );
}

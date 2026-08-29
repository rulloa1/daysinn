import { useState } from "react";
import { Star, ShieldCheck, ThumbsUp, Heart, CheckCircle2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GUEST_REVIEWS, type GuestReview } from "./content";

export function GuestReviewsSection() {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filterOptions = ["All", "Road Tripper", "The Villages Visitor", "Pet Owner", "Family Stay"];

  const filteredReviews =
    activeFilter === "All"
      ? GUEST_REVIEWS
      : GUEST_REVIEWS.filter((r) => r.travelType === activeFilter);

  return (
    <section className="gh-shell scroll-mt-24 pt-[clamp(2.5rem,6vw,4.5rem)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="gh-eyebrow flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--gh-gold)]" />
            Verified Guest Experiences
          </p>
          <h2 className="gh-heading mt-2 text-[var(--gh-blue)]">
            Trusted by Travelers &amp; Families
          </h2>
          <p className="mt-2 max-w-2xl text-[0.95rem] text-[var(--gh-body)]">
            See what recent road-trippers, snowbirds, and visitors to The Villages say about their stay
            with us.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[var(--gh-border)] bg-white p-3 shadow-xs">
          <div className="flex items-center gap-1 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="font-mono text-sm font-bold text-[var(--gh-blue)]">4.6 / 5.0</span>
          <span className="text-[11px] text-slate-400">· 450+ Verified Reviews</span>
        </div>
      </div>

      {/* Ratings Breakdown Card */}
      <div className="mt-7 grid gap-4 rounded-2xl border border-[var(--gh-border)] bg-[var(--gh-surface)] p-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Location & I-75 Access", score: "4.9 / 5.0", width: "98%" },
          { label: "Cleanliness & Housekeeping", score: "4.8 / 5.0", width: "96%" },
          { label: "Front Desk & Hospitality", score: "4.8 / 5.0", width: "96%" },
          { label: "Value & Included Breakfast", score: "4.7 / 5.0", width: "94%" },
        ].map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="font-mono font-bold text-[var(--gh-blue)]">{item.score}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[var(--gh-gold)]"
                style={{ width: item.width }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="mt-7 flex flex-wrap items-center gap-2 border-b border-[var(--gh-border)] pb-4">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setActiveFilter(opt)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeFilter === opt
                ? "bg-[var(--gh-blue)] text-white shadow-sm"
                : "border border-transparent bg-white/70 text-[var(--gh-body-strong)] hover:border-[var(--gh-border)] hover:bg-white"
            }`}
          >
            {opt === "All" ? "All Reviews" : opt}
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {filteredReviews.map((review) => (
          <article
            key={review.author + review.title}
            className="gh-card flex flex-col justify-between bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <Badge className="bg-emerald-50 text-[10px] font-semibold text-emerald-800 border-emerald-200">
                  <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                  {review.stayDate}
                </Badge>
              </div>

              <h3 className="mt-3 font-serif text-[1.15rem] font-bold text-[var(--gh-blue)]">
                "{review.title}"
              </h3>

              <p className="mt-2.5 text-[0.92rem] leading-relaxed text-[var(--gh-body)]">
                {review.body}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--gh-chip)] font-bold text-[var(--gh-blue)]">
                  {review.author[0]}
                </span>
                <div>
                  <p className="font-bold text-slate-800">{review.author}</p>
                  <p className="text-[11px] text-slate-400">{review.location}</p>
                </div>
              </div>

              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                {review.travelType}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

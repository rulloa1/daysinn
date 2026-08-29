import { useState } from "react";
import { Sparkles, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { AMENITY_CATEGORIES, POOL_PHOTO, POOL_PHOTO_ALT } from "./content";

export function InteractiveAmenitiesSection() {
  const [activeTab, setActiveTab] = useState(AMENITY_CATEGORIES[0]!.id);

  const selectedCategory =
    AMENITY_CATEGORIES.find((c) => c.id === activeTab) ?? AMENITY_CATEGORIES[0]!;

  return (
    <section id="amenities" className="gh-shell scroll-mt-24 pt-[clamp(2.5rem,6vw,4.5rem)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="gh-eyebrow flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--gh-gold)]" />
            Comfort &amp; Convenience
          </p>
          <h2 className="gh-heading mt-2 text-[var(--gh-blue)]">
            Included Amenities &amp; Services
          </h2>
          <p className="mt-2 max-w-2xl text-[0.95rem] text-[var(--gh-body)]">
            Everything you need for a restful night and hassle-free morning right off I-75 Exit 329.
          </p>
        </div>
      </div>

      {/* Main Grid: Tabs & Photo on Left, Amenity Cards on Right */}
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Left column: Category selector & featured photo */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-[var(--gh-border)] bg-[var(--gh-surface)] p-3">
            {AMENITY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeTab;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-all ${
                    isActive
                      ? "bg-[var(--gh-blue)] text-white shadow-sm"
                      : "bg-transparent text-slate-700 hover:bg-white/80 hover:text-[var(--gh-blue)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-lg ${
                        isActive
                          ? "bg-white/20 text-[var(--gh-gold)]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold">{cat.name}</p>
                      <p
                        className={`text-[11px] ${
                          isActive ? "text-white/70" : "text-slate-400"
                        } line-clamp-1`}
                      >
                        {cat.items.length} features included
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-300"}`}
                  />
                </button>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[var(--gh-border)] bg-slate-900 shadow-sm">
            <img
              src={POOL_PHOTO}
              alt={POOL_PHOTO_ALT}
              loading="lazy"
              className="h-[240px] w-full object-cover opacity-85 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute right-4 bottom-4 left-4 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gh-gold)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--gh-blue-deep)]">
                <Sparkles className="h-3 w-3" />
                Featured Amenity
              </span>
              <h4 className="mt-1 font-serif text-lg font-bold">Outdoor Heated Swimming Pool</h4>
              <p className="text-xs text-white/80">
                Open daily 9:00 AM – 10:00 PM for guest relaxation.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Dynamic active category items */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--gh-border)] bg-white p-6 shadow-sm">
            <div className="border-b border-[var(--gh-border)] pb-4">
              <h3 className="font-serif text-xl font-bold text-[var(--gh-blue)]">
                {selectedCategory.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{selectedCategory.description}</p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {selectedCategory.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`flex flex-col rounded-xl border p-4 transition-all ${
                      item.highlight
                        ? "border-[var(--gh-gold)]/50 bg-[#FEFBF2]"
                        : "border-slate-100 bg-slate-50/70 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-lg ${
                          item.highlight
                            ? "bg-[var(--gh-gold)] text-[var(--gh-blue-deep)]"
                            : "bg-white text-[var(--gh-blue)] shadow-xs"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4" />
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    </div>

                    <p className="mt-2.5 text-[11px] leading-relaxed text-slate-600">
                      {item.description}
                    </p>

                    <div className="mt-auto pt-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Complimentary
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="flex items-center gap-3 rounded-xl border border-[var(--gh-border)] bg-[var(--gh-surface)] p-4 text-xs text-slate-600">
            <HelpCircle className="h-4 w-4 text-[var(--gh-blue)] shrink-0" />
            <p>
              Traveling with a pet or require ADA accessibility? Mention it during booking or call
              the desk at <strong>(352) 748-7766</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

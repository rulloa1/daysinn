import { useState } from "react";
import {
  BedDouble,
  Users,
  Maximize,
  Coffee,
  Tv,
  Wifi,
  Check,
  Scale,
  X,
  Sparkles,
  Info,
  ExternalLink,
  ShieldCheck,
  Flame,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROOM_SPECS, type RoomSpec } from "./content";

export function RoomShowcaseSection({
  bookingLink,
}: {
  bookingLink: (roomType?: string) => string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "king" | "queen" | "suite">(
    "all"
  );
  const [comparedRooms, setComparedRooms] = useState<RoomSpec[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [quickViewRoom, setQuickViewRoom] = useState<RoomSpec | null>(null);

  const filteredRooms =
    selectedCategory === "all"
      ? ROOM_SPECS
      : ROOM_SPECS.filter((room) => room.category === selectedCategory);

  function toggleCompare(room: RoomSpec) {
    setComparedRooms((prev) => {
      const exists = prev.some((r) => r.id === room.id);
      if (exists) {
        return prev.filter((r) => r.id !== room.id);
      }
      if (prev.length >= 3) {
        return [prev[1]!, prev[2]!, room];
      }
      return [...prev, room];
    });
  }

  function isCompared(room: RoomSpec) {
    return comparedRooms.some((r) => r.id === room.id);
  }

  return (
    <section id="rooms" className="gh-shell scroll-mt-24 pt-[clamp(2.5rem,6vw,4.5rem)]">
      {/* Header with Title and Comparison Bar trigger */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="gh-eyebrow flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--gh-gold)]" />
            Comfort &amp; Rest
          </p>
          <h2 className="gh-heading mt-2 text-[var(--gh-blue)]">
            Explore Rooms &amp; Sleeping Options
          </h2>
          <p className="mt-2 max-w-2xl text-[0.95rem] text-[var(--gh-body)]">
            Every room includes complimentary Daybreak® breakfast, high-speed Wi-Fi, micro-fridge,
            microwave, and HD TV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {comparedRooms.length > 0 && (
            <Button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="spring-hover rounded-xl bg-[var(--gh-gold)] px-4 py-2 text-xs font-bold text-[var(--gh-blue-deep)] shadow-sm hover:brightness-105"
            >
              <Scale className="mr-1.5 h-4 w-4" />
              Compare ({comparedRooms.length})
            </Button>
          )}

          <a
            href={bookingLink()}
            target="_blank"
            rel="noreferrer"
            className="signage font-bold text-[var(--gh-blue)] underline-offset-4 hover:underline"
          >
            See live rates on Wyndham ↗
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-7 flex flex-wrap items-center gap-2 border-b border-[var(--gh-border)] pb-4">
        {[
          { id: "all", label: "All Room Options" },
          { id: "king", label: "1 King Bed" },
          { id: "queen", label: "2 Queen Beds" },
          { id: "suite", label: "Hospitality Suites" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedCategory === tab.id
                ? "bg-[var(--gh-blue)] text-white shadow-sm"
                : "border border-transparent bg-white/70 text-[var(--gh-body-strong)] hover:border-[var(--gh-border)] hover:bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Room Cards Grid */}
      <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => {
          const compared = isCompared(room);
          return (
            <article
              key={room.id}
              className="gh-card group flex flex-col overflow-hidden bg-white shadow-sm transition-all duration-300 hover:shadow-md"
            >
              {/* Image Container with Badges */}
              <div className="relative h-[230px] w-full overflow-hidden bg-slate-100">
                <img
                  src={room.image}
                  alt={room.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <Badge className="bg-[var(--gh-blue-deep)]/90 text-[10px] font-bold text-white backdrop-blur-sm">
                    {room.tag}
                  </Badge>
                </div>

                <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                  <Maximize className="h-3 w-3 text-[var(--gh-gold)]" />
                  {room.sqft} sq ft
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-[1.3rem] font-bold text-[var(--gh-blue)]">
                      {room.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <BedDouble className="h-3.5 w-3.5 text-[var(--gh-gold)]" />
                      {room.beds}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-[var(--gh-chip)] px-2.5 py-1 text-[0.68rem] font-bold tracking-wider text-[var(--gh-link)] uppercase">
                    {room.sleeps}
                  </span>
                </div>

                <p className="mt-3 text-[0.9rem] leading-relaxed text-[var(--gh-body)]">
                  {room.body}
                </p>

                {/* Key Amenities Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--gh-border)] pt-4">
                  {room.features.slice(0, 3).map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                    >
                      <Check className="h-3 w-3 text-emerald-600" />
                      {feat}
                    </span>
                  ))}
                </div>

                {/* Pricing & Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--gh-border)] pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                      Estimated from
                    </p>
                    <p className="text-base font-bold text-[var(--gh-blue)]">
                      ${room.rateEstimate}
                      <span className="text-xs font-normal text-slate-500">/night</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickViewRoom(room)}
                      aria-label={`Quick view ${room.name}`}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--gh-border)] bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-[var(--gh-blue)]"
                    >
                      <Info className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCompare(room)}
                      aria-label={compared ? "Remove from compare" : "Add to compare"}
                      className={`grid h-9 w-9 place-items-center rounded-lg border text-xs font-bold transition ${
                        compared
                          ? "border-[var(--gh-gold)] bg-[var(--gh-gold)] text-[var(--gh-blue-deep)] shadow-sm"
                          : "border-[var(--gh-border)] bg-white text-slate-500 hover:border-slate-400"
                      }`}
                    >
                      <Scale className="h-4 w-4" />
                    </button>

                    <a
                      href={bookingLink(room.key)}
                      target="_blank"
                      rel="noreferrer"
                      className="spring-hover rounded-xl bg-[var(--gh-blue)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
                    >
                      Book on Wyndham ↗
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Floating Compare Drawer Bar if rooms selected */}
      {comparedRooms.length > 0 && (
        <div className="fixed right-6 bottom-6 z-40 flex items-center gap-4 rounded-2xl border border-[var(--gh-border)] bg-white/95 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--gh-blue)] text-xs font-bold text-white">
              {comparedRooms.length}
            </span>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[var(--gh-blue)]">
                {comparedRooms.map((r) => r.name).join(" vs ")}
              </p>
              <p className="text-[10px] text-slate-500">Ready to compare side-by-side</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="rounded-xl bg-[var(--gh-blue)] px-4 py-2 text-xs font-bold text-white"
            >
              Compare Now
            </Button>
            <button
              type="button"
              onClick={() => setComparedRooms([])}
              aria-label="Clear compare list"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick View Room Dialog */}
      <Dialog open={quickViewRoom !== null} onOpenChange={(open) => !open && setQuickViewRoom(null)}>
        {quickViewRoom && (
          <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border border-[var(--gh-border)] bg-white p-0 shadow-2xl">
            <div className="relative h-60 w-full bg-slate-100">
              <img
                src={quickViewRoom.image}
                alt={quickViewRoom.alt}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute right-4 bottom-4 left-4 text-white">
                <Badge className="mb-2 bg-[var(--gh-gold)] text-[10px] font-bold text-[var(--gh-blue-deep)]">
                  {quickViewRoom.tag}
                </Badge>
                <h3 className="font-serif text-2xl font-bold">{quickViewRoom.name}</h3>
                <p className="text-xs text-white/80">
                  {quickViewRoom.beds} · {quickViewRoom.sqft} sq ft · {quickViewRoom.sleeps}
                </p>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <p className="text-sm leading-relaxed text-[var(--gh-body)]">{quickViewRoom.body}</p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Included In-Room Amenities
                </h4>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {quickViewRoom.features.concat(quickViewRoom.appliances).map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Accessibility &amp; Special Needs</p>
                <p className="mt-1">{quickViewRoom.accessibility}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-[10px] uppercase text-slate-400">Estimated Rate</p>
                  <p className="text-lg font-bold text-[var(--gh-blue)]">
                    ${quickViewRoom.rateEstimate}
                    <span className="text-xs font-normal text-slate-500">/night</span>
                  </p>
                </div>

                <a
                  href={bookingLink(quickViewRoom.key)}
                  target="_blank"
                  rel="noreferrer"
                  className="spring-hover rounded-xl bg-[var(--gh-blue)] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110"
                >
                  Reserve on Wyndham.com ↗
                </a>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Compare Side-by-Side Dialog */}
      <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
        <DialogContent className="max-w-4xl rounded-3xl border border-[var(--gh-border)] bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-[var(--gh-blue)]">
              Room Comparison
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Side-by-side feature and specification comparison for your Wildwood stay.
            </DialogDescription>
          </DialogHeader>

          {comparedRooms.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              Select 2 or more rooms to compare their features side-by-side.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-slate-400 font-semibold uppercase text-[10px]">
                      Feature
                    </th>
                    {comparedRooms.map((r) => (
                      <th key={r.id} className="pb-3 font-bold text-[var(--gh-blue)] text-sm">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 font-semibold text-slate-600">Bed Setup</td>
                    {comparedRooms.map((r) => (
                      <td key={r.id} className="py-3 font-medium text-slate-800">
                        {r.beds}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-600">Max Capacity</td>
                    {comparedRooms.map((r) => (
                      <td key={r.id} className="py-3 text-slate-800">
                        {r.sleeps} (Max {r.maxOccupancy} guests)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-600">Room Size</td>
                    {comparedRooms.map((r) => (
                      <td key={r.id} className="py-3 font-mono text-slate-800">
                        {r.sqft} sq ft
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-600">Micro-Fridge &amp; Microwave</td>
                    {comparedRooms.map((r) => (
                      <td key={r.id} className="py-3 text-emerald-600 font-semibold">
                        ✓ Included
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-600">Daybreak® Breakfast</td>
                    {comparedRooms.map((r) => (
                      <td key={r.id} className="py-3 text-emerald-600 font-semibold">
                        ✓ Complimentary
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-600">High-Speed Wi-Fi</td>
                    {comparedRooms.map((r) => (
                      <td key={r.id} className="py-3 text-emerald-600 font-semibold">
                        ✓ Free High-Speed
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-600">Estimated Rate</td>
                    {comparedRooms.map((r) => (
                      <td key={r.id} className="py-3 font-bold text-base text-[var(--gh-blue)]">
                        ${r.rateEstimate}
                        <span className="text-[10px] font-normal text-slate-500">/nt</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4"></td>
                    {comparedRooms.map((r) => (
                      <td key={r.id} className="py-4">
                        <a
                          href={bookingLink(r.key)}
                          target="_blank"
                          rel="noreferrer"
                          className="spring-hover inline-block rounded-xl bg-[var(--gh-blue)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
                        >
                          Book {r.name} ↗
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

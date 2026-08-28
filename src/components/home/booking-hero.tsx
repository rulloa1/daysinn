import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import propertyAsset from "@/assets/days-inn-property.webp.asset.json";
import type { AvailabilityRow, useAvailability } from "./use-availability";

type Availability = ReturnType<typeof useAvailability>;

function AvailabilityCard({
  row,
  nights,
  bookingLink,
}: {
  row: AvailabilityRow;
  nights: number;
  bookingLink: (roomType?: string) => string;
}) {
  const open = row.available_count > 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
      <div>
        <p className="font-serif text-sm font-bold text-white">{row.label}</p>
        <p className="text-[11px] text-slate-200/80">
          {open
            ? `${row.available_count} room${row.available_count === 1 ? "" : "s"} open · sleeps up to ${row.max_occupancy}`
            : "Sold out for these dates"}
        </p>
        {open ? (
          <p className="mt-1 text-xs font-bold text-[#D4AF37]">
            Estimated from ${Number(row.nightly_rate).toFixed(0)}/night before taxes and fees
            {nights > 1 ? (
              <span className="font-medium text-slate-200/80">
                {" "}
                · estimated ${(Number(row.nightly_rate) * nights).toFixed(0)} for {nights} nights
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      {open ? (
        <a
          href={bookingLink(row.room_type)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#004986] shadow-md transition hover:bg-[#D4AF37]/90 active:scale-95"
        >
          Continue to Wyndham ↗
        </a>
      ) : (
        <a
          href="tel:+13527487766"
          className="shrink-0 rounded-xl border border-white/30 px-4 py-2 text-xs font-bold text-white"
        >
          Call desk
        </a>
      )}
    </div>
  );
}

export function BookingHero({ availability }: { availability: Availability }) {
  const { checkIn, checkOut, guests, rows, searching, nights } = availability;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#00243F] shadow-xl">
      {/* Photo layer with gradient */}
      <img
        src={propertyAsset.url}
        alt="Days Inn Wildwood exterior at dusk"
        width={1600}
        height={1067}
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#00243F]/95 via-[#00243F]/80 to-[#00243F]/40" />

      {/* Content wrapper */}
      <div className="relative z-10 p-6 pt-16 md:p-12 md:pt-24">
        <div className="flex items-center gap-2">
          <span className="h-1 w-3 rounded-full bg-[#D4AF37]" />
          <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">
            Days Inn® by Wyndham Wildwood I-75 · I-75 Exit 329 · Wildwood, FL
          </p>
        </div>

        <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-[3.1rem] leading-tight">
          Rooms off I-75 with free breakfast, pool &amp; parking.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
          Check-in 3:00 PM · Check-out 11:00 AM. Pet-friendly rooms, free Wi-Fi, and RV/truck
          parking — 10 minutes from The Villages.
        </p>

        {/* Availability Search Bar */}
        <form
          onSubmit={availability.search}
          className="mt-8 grid max-w-4xl gap-3 rounded-2xl border border-[#D2DBE6] bg-[#F5F8FB] p-5 shadow-2xl sm:grid-cols-[1fr_1fr_1fr_auto] items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor="check-in" className="text-xs font-bold text-slate-700">
              Check in
            </Label>
            <Input
              id="check-in"
              type="date"
              value={checkIn}
              onChange={(event) => availability.setCheckIn(event.target.value)}
              className="h-11 rounded-xl border-[#BCC9D8] bg-white font-mono text-sm text-slate-900"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="check-out" className="text-xs font-bold text-slate-700">
              Check out
            </Label>
            <Input
              id="check-out"
              type="date"
              value={checkOut}
              onChange={(event) => availability.setCheckOut(event.target.value)}
              className="h-11 rounded-xl border-[#BCC9D8] bg-white font-mono text-sm text-slate-900"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guests" className="text-xs font-bold text-slate-700">
              Guests
            </Label>
            <Input
              id="guests"
              type="number"
              min={1}
              max={6}
              value={guests}
              onChange={(event) => availability.setGuests(event.target.value)}
              className="h-11 rounded-xl border-[#BCC9D8] bg-white font-mono text-sm text-slate-900"
            />
          </div>
          <Button
            type="submit"
            disabled={searching}
            className="h-11 rounded-xl bg-[#004986] px-6 text-xs font-bold text-white shadow-md transition hover:bg-[#004986]/90 active:scale-[0.98]"
          >
            {searching ? "Checking…" : "Check availability"}
          </Button>
        </form>

        {rows ? (
          <div className="mt-4 grid max-w-4xl gap-3 sm:grid-cols-2">
            {rows.length === 0 ? (
              <p className="rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-white/90 backdrop-blur-xl sm:col-span-2">
                No room type sleeps {guests} guests. Call the front desk at (352) 748-7766 and we'll
                arrange adjoining rooms.
              </p>
            ) : (
              rows.map((row) => (
                <AvailabilityCard
                  key={row.room_type}
                  row={row}
                  nights={nights}
                  bookingLink={availability.bookingLink}
                />
              ))
            )}
          </div>
        ) : null}

        <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-white/60">
          Availability and price shown here are an indicative property snapshot. Final room type,
          availability, rate, taxes, fees, cancellation terms, and Wyndham Rewards eligibility are
          confirmed during booking on Wyndham.com.
        </p>
      </div>
    </section>
  );
}

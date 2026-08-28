import { MapPin, Sparkles } from "lucide-react";
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
          <p className="mt-1 text-xs font-bold text-amber">
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
          rel="noreferrer"
          className="spring-hover shrink-0 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-md"
        >
          Continue to Wyndham ↗
        </a>
      ) : (
        <a
          href="tel:+13527487766"
          className="shrink-0 rounded-xl border border-white/30 px-4 py-2 text-xs font-bold text-white"
        >
          Call us
        </a>
      )}
    </div>
  );
}

export function BookingHero({ availability }: { availability: Availability }) {
  const { checkIn, checkOut, guests, rows, searching, nights } = availability;

  return (
    <section className="glass-hero relative mt-6 overflow-hidden rounded-3xl border border-white/20 shadow-xl">
      <img
        src={propertyAsset.url}
        alt="Days Inn Wildwood exterior at dusk with lit walkways"
        width={1600}
        height={1067}
        className="absolute inset-0 h-full w-full object-cover brightness-[0.55]"
      />
      <div className="relative flex flex-col justify-end bg-gradient-to-t from-slate-950/92 via-slate-950/55 to-slate-950/30 p-6 pt-24 md:p-10 md:pt-40">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            Days Inn® by Wyndham Wildwood I-75
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
            <MapPin className="h-3 w-3" /> I-75 Exit 329 · Wildwood, FL
          </span>
        </div>

        <h1 className="mt-3 max-w-2xl font-serif text-3xl font-bold tracking-tight text-white md:text-5xl">
          Rooms off I-75 with free breakfast, pool & parking.
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-200/90 md:text-base">
          Check-in 3:00 PM · Check-out 11:00 AM. Pet-friendly rooms, free Wi-Fi, and RV/truck
          parking — 10 minutes from The Villages.
        </p>

        <form
          onSubmit={availability.search}
          className="mt-5 grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <div className="space-y-1">
            <Label htmlFor="check-in" className="text-[11px] font-bold text-white/80">
              Check in
            </Label>
            <Input
              id="check-in"
              type="date"
              value={checkIn}
              onChange={(event) => availability.setCheckIn(event.target.value)}
              className="rounded-xl border-white/25 bg-white/90 text-ink"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="check-out" className="text-[11px] font-bold text-white/80">
              Check out
            </Label>
            <Input
              id="check-out"
              type="date"
              value={checkOut}
              onChange={(event) => availability.setCheckOut(event.target.value)}
              className="rounded-xl border-white/25 bg-white/90 text-ink"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="guests" className="text-[11px] font-bold text-white/80">
              Guests
            </Label>
            <Input
              id="guests"
              type="number"
              min={1}
              max={6}
              value={guests}
              onChange={(event) => availability.setGuests(event.target.value)}
              className="w-full rounded-xl border-white/25 bg-white/90 text-ink sm:w-24"
            />
          </div>
          <Button
            type="submit"
            disabled={searching}
            className="spring-hover mt-auto h-10 rounded-xl bg-accent px-6 font-bold text-accent-foreground shadow-md hover:brightness-105"
          >
            {searching ? "Checking…" : "Check availability"}
          </Button>
        </form>

        {rows ? (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
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

        <p className="mt-2 text-[11px] text-slate-300/80">
          Availability and price shown here are an indicative property snapshot. Final room type,
          availability, rate, taxes, fees, cancellation terms, and Wyndham Rewards eligibility are
          confirmed during booking on Wyndham.com.
        </p>
      </div>
    </section>
  );
}

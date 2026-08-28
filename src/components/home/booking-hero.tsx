import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HERO_PHOTO } from "./content";
import type { AvailabilityRow, useAvailability } from "./use-availability";

type Availability = ReturnType<typeof useAvailability>;

const FIELD_LABEL = "signage font-bold text-[var(--gh-muted)]";
const FIELD =
  "min-h-11 w-full rounded-[10px] border border-[var(--gh-field-border)] bg-white px-3 text-[0.92rem] text-[var(--gh-ink)] outline-none focus-visible:border-[var(--gh-blue)] focus-visible:ring-2 focus-visible:ring-[var(--gh-blue)]/25";

/** Guest counts offered in the hero. Values stay numeric for the availability RPC. */
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6];

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
    <div className="gh-card flex items-center justify-between gap-3 p-4">
      <div>
        <p className="font-serif text-sm font-bold text-[var(--gh-blue)]">{row.label}</p>
        <p className="text-[11px] text-[var(--gh-body)]">
          {open
            ? `${row.available_count} room${row.available_count === 1 ? "" : "s"} open · sleeps up to ${row.max_occupancy}`
            : "Sold out for these dates"}
        </p>
        {open ? (
          <p className="mt-1 text-xs font-bold text-[var(--gh-blue)]">
            Estimated from ${Number(row.nightly_rate).toFixed(0)}/night before taxes and fees
            {nights > 1 ? (
              <span className="font-medium text-[var(--gh-body)]">
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
          className="spring-hover shrink-0 rounded-[10px] bg-[var(--gh-blue)] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
        >
          Continue to Wyndham ↗
        </a>
      ) : (
        <a
          href="tel:+13527487766"
          className="shrink-0 rounded-[10px] border border-[var(--gh-field-border)] bg-white px-4 py-2.5 text-xs font-bold text-[var(--gh-blue)]"
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
    <section className="relative overflow-hidden bg-[var(--gh-blue-deep)]">
      <img
        src={HERO_PHOTO}
        alt="Days Inn Wildwood exterior at dusk with lit walkways"
        width={1600}
        height={1067}
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(0,36,63,0.92) 0%, rgba(0,36,63,0.72) 48%, rgba(0,36,63,0.25) 100%)",
        }}
      />

      <div className="gh-shell relative pb-10 pt-[clamp(3rem,8vw,5.5rem)]">
        <p className="gh-eyebrow flex items-center gap-2.5">
          <span className="h-3 w-[3px] shrink-0 bg-[var(--gh-gold)]" />
          Days Inn® by Wyndham Wildwood I-75 · I-75 Exit 329 · Wildwood, FL
        </p>

        <h1 className="mt-[18px] max-w-[44rem] font-serif text-[clamp(2rem,1.3rem+3vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.015em] text-white text-pretty">
          Rooms off I-75 with free breakfast, pool &amp; parking.
        </h1>

        <p className="mt-[18px] max-w-[38rem] text-[1.05rem] leading-relaxed text-white/80 text-pretty">
          Check-in 3:00 PM · Check-out 11:00 AM. Pet-friendly rooms, free Wi-Fi, and RV/truck
          parking — 10 minutes from The Villages.
        </p>

        <form
          onSubmit={availability.search}
          className="mt-9 grid max-w-[56rem] grid-cols-1 gap-4 rounded-2xl bg-[var(--gh-surface)] p-5 shadow-[0_20px_25px_rgba(0,26,46,0.25)] sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end lg:gap-0"
        >
          <div className="flex flex-col gap-[7px] lg:border-r lg:border-[var(--gh-border)] lg:pr-5">
            <Label htmlFor="check-in" className={FIELD_LABEL}>
              Check in
            </Label>
            <input
              id="check-in"
              type="date"
              value={checkIn}
              onChange={(event) => availability.setCheckIn(event.target.value)}
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-[7px] lg:border-r lg:border-[var(--gh-border)] lg:px-5">
            <Label htmlFor="check-out" className={FIELD_LABEL}>
              Check out
            </Label>
            <input
              id="check-out"
              type="date"
              value={checkOut}
              onChange={(event) => availability.setCheckOut(event.target.value)}
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-[7px] lg:px-5">
            <Label htmlFor="guests" className={FIELD_LABEL}>
              Guests
            </Label>
            <select
              id="guests"
              value={guests}
              onChange={(event) => availability.setGuests(event.target.value)}
              className={FIELD}
            >
              {GUEST_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={searching}
            className="spring-hover min-h-11 whitespace-nowrap rounded-[10px] bg-[var(--gh-blue)] px-6 text-[0.92rem] font-bold text-white shadow-sm hover:bg-[var(--gh-blue)] hover:brightness-110"
          >
            {searching ? "Checking…" : "Check availability"}
          </Button>
        </form>

        {rows ? (
          <div className="mt-4 grid max-w-[56rem] gap-3 sm:grid-cols-2">
            {rows.length === 0 ? (
              <p className="gh-card p-4 text-xs text-[var(--gh-body)] sm:col-span-2">
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

        <p className="mt-4 max-w-[52rem] text-[0.78rem] leading-relaxed text-white/55">
          Availability and price shown here are an indicative property snapshot. Final room type,
          availability, rate, taxes, fees, cancellation terms, and Wyndham Rewards eligibility are
          confirmed during booking on Wyndham.com.
        </p>
      </div>
    </section>
  );
}

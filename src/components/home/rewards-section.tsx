import {
  BOOKING_URL,
  FranchiseDisclaimer,
  WYNDHAM_REWARDS_JOIN_URL,
} from "@/components/franchise-footer";
import { REWARDS } from "./content";

export function RewardsSection() {
  return (
    <section className="mt-[clamp(2.5rem,6vw,4.5rem)] bg-[var(--gh-blue-deep)] py-[clamp(2.5rem,6vw,4rem)]">
      <div className="gh-shell">
        <p className="gh-eyebrow">Wyndham Rewards® Member Benefits</p>
        <h2 className="gh-heading mt-3 max-w-[40rem] text-white text-pretty">
          Book through Wyndham. Earn points on qualifying stays.
        </h2>
        <p className="mt-3 max-w-[44rem] text-[0.98rem] leading-relaxed text-white/72">
          Sign in to Wyndham Rewards® during official booking to see eligible member offers and earn
          points where program requirements are met.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="spring-hover rounded-[10px] bg-[var(--gh-gold)] px-5 py-3.5 text-[0.85rem] font-bold text-[var(--gh-blue-deep)] shadow-sm"
          >
            Book on Wyndham.com ↗
          </a>
          <a
            href={WYNDHAM_REWARDS_JOIN_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-[10px] border border-white/35 px-5 py-3.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-white/10"
          >
            Join Wyndham Rewards ↗
          </a>
        </div>

        <div className="mt-9 grid gap-6 border-t border-white/15 pt-8 md:grid-cols-3">
          {REWARDS.map((perk) => (
            <div key={perk.title}>
              <p className="signage font-bold tracking-[0.16em] text-white/45">{perk.badge}</p>
              <a
                href={perk.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 block text-[0.98rem] font-semibold text-[var(--gh-gold)] underline-offset-4 hover:underline"
              >
                {perk.title} ↗
              </a>
              <p className="mt-2.5 text-[0.88rem] leading-relaxed text-white/70 text-pretty">
                {perk.body}
              </p>
            </div>
          ))}
        </div>

        <FranchiseDisclaimer className="mt-7 max-w-[60rem] text-[0.78rem] leading-[1.65] text-white/45 [&_a]:text-white/70" />
      </div>
    </section>
  );
}

import { Phone, ShieldCheck } from "lucide-react";
import {
  BOOKING_URL,
  FranchiseDisclaimer,
  WYNDHAM_REWARDS_JOIN_URL,
} from "@/components/franchise-footer";
import { MAP_URL, REWARDS } from "./content";

export function RewardsSection() {
  return (
    <section className="relative mt-10 rounded-3xl border border-slate-800 bg-[#0f172a] p-7 text-white shadow-xl md:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber">
            <ShieldCheck className="h-3.5 w-3.5" /> Wyndham Rewards® Member Benefits
          </span>
          <h2 className="mt-2 font-serif text-2xl font-bold text-white md:text-3xl">
            Book through Wyndham. Earn points on qualifying stays.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300/85">
            Sign in to Wyndham Rewards® during official booking to see eligible member offers and
            earn points where program requirements are met.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="spring-hover rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground shadow-md hover:brightness-105"
          >
            Book on Wyndham.com ↗
          </a>
          <a
            href={WYNDHAM_REWARDS_JOIN_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/30 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
          >
            Join Wyndham Rewards ↗
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-3.5 md:grid-cols-3">
        {REWARDS.map((perk) => (
          <article
            key={perk.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-amber">
              {perk.badge}
            </span>
            <a
              href={perk.href}
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 block font-serif text-base font-bold text-white underline-offset-4 hover:text-amber hover:underline"
            >
              {perk.title} ↗
            </a>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300/80">{perk.body}</p>
          </article>
        ))}
      </div>
      <FranchiseDisclaimer className="mt-5 text-[11px] leading-relaxed text-slate-400" />
    </section>
  );
}

export function ContactSection() {
  return (
    <section className="glass-card mt-10 grid gap-4 rounded-3xl p-6 md:grid-cols-3 md:items-center">
      <a href={MAP_URL} target="_blank" rel="noreferrer" className="group block">
        <p className="signage font-bold text-primary">Property Location</p>
        <p className="mt-1 font-serif text-base font-bold text-foreground transition-colors group-hover:text-primary">
          551 East SR 44
        </p>
        <p className="text-xs text-muted-foreground">
          Wildwood, FL 34785 (Right off I-75 Exit 329)
        </p>
      </a>

      <div>
        <p className="signage font-bold text-primary">Complimentary Wi-Fi</p>
        <p className="mt-1 font-serif text-base font-bold text-foreground">
          High-Speed Guest Network
        </p>
        <p className="text-xs text-muted-foreground">
          Connect to <strong className="text-foreground">DaysInn_Guest</strong> (No password
          needed).
        </p>
      </div>

      <a
        href="tel:+13527487766"
        className="spring-hover flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-xs font-bold text-primary-foreground shadow-md hover:brightness-110"
      >
        <Phone className="h-4 w-4 text-amber" />
        Front Desk · (352) 748-7766
      </a>
    </section>
  );
}

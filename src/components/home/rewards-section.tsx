import { Phone, ShieldCheck, MapPin, Navigation } from "lucide-react";
import {
  BOOKING_URL,
  FranchiseDisclaimer,
  WYNDHAM_REWARDS_JOIN_URL,
} from "@/components/franchise-footer";
import { MAP_URL, REWARDS } from "./content";

export function RewardsSection() {
  return (
    <section className="mt-16 -mx-5 overflow-hidden rounded-3xl bg-[#00243F] p-6 text-white md:-mx-8 md:p-12 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
            <ShieldCheck className="h-4 w-4" /> Wyndham Rewards® Member Benefits
          </span>
          <h2 className="mt-2 font-serif text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            Book through Wyndham. Earn points on qualifying stays.
          </h2>
          <p className="mt-2.5 max-w-2xl text-xs leading-relaxed text-white/75 md:text-sm">
            Sign in to Wyndham Rewards® during official booking to see eligible member offers and
            earn points where program requirements are met.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#D4AF37] px-5 py-3 text-xs font-bold text-[#00243F] shadow-sm transition hover:bg-[#D4AF37]/90 active:scale-95"
          >
            Book on Wyndham.com ↗
          </a>
          <a
            href={WYNDHAM_REWARDS_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/35 bg-transparent px-5 py-3 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Join Wyndham Rewards ↗
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-4 border-t border-white/15 pt-8 md:grid-cols-3">
        {REWARDS.map((perk) => (
          <article
            key={perk.title}
            className="rounded-2xl border border-white/12 bg-white/5 p-5 backdrop-blur-md"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              {perk.badge}
            </span>
            <a
              href={perk.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block font-serif text-base font-bold text-white hover:text-[#D4AF37]"
            >
              {perk.title} ↗
            </a>
            <p className="mt-1.5 text-xs leading-relaxed text-white/70">{perk.body}</p>
          </article>
        ))}
      </div>

      <FranchiseDisclaimer className="mt-6 text-[11px] leading-relaxed text-white/50" />
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="location" className="mt-16 scroll-mt-20">
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Left Location Card */}
        <div className="rounded-2xl border border-[#D2DBE6] bg-[#F5F8FB] p-6 md:p-8 shadow-xs">
          <p className="text-[11px] font-bold tracking-widest text-[#004986] uppercase">
            Property Location &amp; Access
          </p>
          <h3 className="mt-2 font-serif text-xl font-bold text-[#004986]">
            551 East SR 44, Wildwood, FL 34785
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Conveniently situated right at I-75 Exit 329, providing seamless highway access, ample parking for cars, SUVs, buses, RVs, and commercial trucks — just 10 minutes from The Villages.
          </p>

          <p className="mt-5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Turn-by-Turn GPS Navigation
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=28.872883,-82.093933"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#004986] shadow-2xs hover:bg-slate-50"
            >
              Google Maps ↗
            </a>
            <a
              href="https://maps.apple.com/?daddr=28.872883,-82.093933"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#004986] shadow-2xs hover:bg-slate-50"
            >
              Apple Maps ↗
            </a>
            <a
              href="https://waze.com/ul?ll=28.872883,-82.093933&navigate=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#004986] shadow-2xs hover:bg-slate-50"
            >
              Waze ↗
            </a>
          </div>
        </div>

        {/* Right Contact & Highlights */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#D2DBE6] bg-[#F5F8FB] p-5 shadow-2xs">
            <p className="text-[10px] font-bold tracking-wider text-[#D4AF37] uppercase">Complimentary</p>
            <h4 className="mt-1 font-serif text-base font-bold text-[#004986]">Free High-Speed Wi-Fi</h4>
            <p className="mt-1.5 text-xs text-slate-600">
              Connect directly to <strong className="text-slate-900">DaysInn_Guest</strong> (No password needed).
            </p>
          </div>

          <div className="rounded-2xl border border-[#D2DBE6] bg-[#F5F8FB] p-5 shadow-2xs">
            <p className="text-[10px] font-bold tracking-wider text-[#D4AF37] uppercase">Front Team</p>
            <h4 className="mt-1 font-serif text-base font-bold text-[#004986]">24/7 Front Desk</h4>
            <a
              href="tel:+13527487766"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#004986] hover:underline"
            >
              <Phone className="h-3.5 w-3.5" /> (352) 748-7766
            </a>
          </div>

          <div className="sm:col-span-2 rounded-2xl bg-[#004986] p-5 text-white shadow-xs">
            <p className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
              Direct Booking Assurance
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/80">
              Best Rate Guarantee when you book directly on Wyndham.com or by calling our on-site team directly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { Sparkles, Award, Gift, ChevronRight, ShieldCheck, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  BOOKING_URL,
  WYNDHAM_REWARDS_JOIN_URL,
  WYNDHAM_REWARDS_EARN_URL,
} from "@/components/franchise-footer";

const TIERS = [
  {
    id: "blue",
    name: "Blue",
    multiplier: 1.0,
    bonusLabel: "Base Earning",
    perks: "Free Wi-Fi · Rollover Nights · Member Rates",
    color: "bg-sky-700 text-white",
  },
  {
    id: "discoverer",
    name: "Discoverer",
    multiplier: 1.1,
    bonusLabel: "+10% Bonus Points",
    perks: "Preferred Room Choice · 10% Points Bonus",
    color: "bg-amber-600 text-white",
  },
  {
    id: "gold",
    name: "Gold",
    multiplier: 1.15,
    bonusLabel: "+15% Bonus Points",
    perks: "Late Checkout (2 PM) · Dedicated Member Line",
    color: "bg-yellow-600 text-white",
  },
  {
    id: "platinum",
    name: "Platinum",
    multiplier: 1.2,
    bonusLabel: "+20% Bonus Points",
    perks: "Early Check-in · Avis/Budget Rental Upgrades",
    color: "bg-slate-700 text-white",
  },
  {
    id: "diamond",
    name: "Diamond",
    multiplier: 1.3,
    bonusLabel: "+30% Bonus Points",
    perks: "Suite Upgrades · Welcome Snack or Beverage",
    color: "bg-cyan-800 text-white",
  },
];

export function RewardsCalculator() {
  const [nights, setNights] = useState(2);
  const [nightlyRate, setNightlyRate] = useState(99);
  const [selectedTier, setSelectedTier] = useState(TIERS[0]!);

  const totalSpend = nights * nightlyRate;
  const rawBasePoints = totalSpend * 10;
  // Wyndham guarantees minimum 1,000 points per qualified stay
  const basePoints = Math.max(1000, rawBasePoints);
  const totalEarnedPoints = Math.round(basePoints * selectedTier.multiplier);
  const freeNightThreshold = 7500;
  const progressPercent = Math.min(100, Math.round((totalEarnedPoints / freeNightThreshold) * 100));

  return (
    <div className="mt-10 overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gh-gold)] px-3 py-1 text-[11px] font-bold text-[var(--gh-blue-deep)]">
            <Gift className="h-3.5 w-3.5" />
            Interactive Stay &amp; Points Estimator
          </span>
          <h3 className="mt-2 font-serif text-2xl font-bold text-white">
            Calculate Your Wyndham Rewards® Points
          </h3>
          <p className="mt-1 text-xs text-white/70">
            Earn 10 points per \$1 spent or minimum 1,000 points on every qualified stay.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={WYNDHAM_REWARDS_JOIN_URL}
            target="_blank"
            rel="noreferrer"
            className="spring-hover rounded-xl bg-[var(--gh-gold)] px-4 py-2.5 text-xs font-bold text-[var(--gh-blue-deep)] shadow-sm hover:brightness-105"
          >
            Join Free ↗
          </a>
        </div>
      </div>

      <div className="mt-6 grid items-center gap-8 lg:grid-cols-2">
        {/* Left Column: Sliders and Tier Selection */}
        <div className="space-y-6">
          {/* Nights Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-white">
              <span className="font-semibold text-white/80">Length of Stay</span>
              <span className="font-bold text-[var(--gh-gold)] font-mono text-sm">
                {nights} {nights === 1 ? "Night" : "Nights"}
              </span>
            </div>
            <Slider
              value={[nights]}
              min={1}
              max={14}
              step={1}
              onValueChange={(val) => setNights(val[0] ?? 1)}
              className="mt-3 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-white/40 font-mono">
              <span>1 Night</span>
              <span>7 Nights</span>
              <span>14 Nights</span>
            </div>
          </div>

          {/* Nightly Rate Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-white">
              <span className="font-semibold text-white/80">Estimated Average Nightly Rate</span>
              <span className="font-bold text-[var(--gh-gold)] font-mono text-sm">
                \${nightlyRate}/night
              </span>
            </div>
            <Slider
              value={[nightlyRate]}
              min={79}
              max={199}
              step={5}
              onValueChange={(val) => setNightlyRate(val[0] ?? 99)}
              className="mt-3 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-white/40 font-mono">
              <span>\$79</span>
              <span>\$139</span>
              <span>\$199</span>
            </div>
          </div>

          {/* Member Tier Selector */}
          <div>
            <span className="text-xs font-semibold text-white/80">Select Member Tier:</span>
            <div className="mt-2.5 grid grid-cols-5 gap-1.5">
              {TIERS.map((tier) => {
                const isSelected = selectedTier.id === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`rounded-xl p-2 text-center transition-all ${
                      isSelected
                        ? "bg-white text-[var(--gh-blue-deep)] font-bold shadow-md scale-[1.03]"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    <p className="text-[11px]">{tier.name}</p>
                    <p className="text-[9px] opacity-75 font-mono">
                      {tier.multiplier === 1 ? "Base" : `+${Math.round((tier.multiplier - 1) * 100)}%`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Results & Progress */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/20 bg-black/25 p-6 backdrop-blur-sm">
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Estimated Points Earned
              </p>
              <Badge className="bg-[var(--gh-gold)] text-[10px] font-bold text-[var(--gh-blue-deep)]">
                {selectedTier.bonusLabel}
              </Badge>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-[var(--gh-gold)]">
                {totalEarnedPoints.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-white/80">Wyndham Rewards® pts</span>
            </div>

            <p className="mt-2 text-xs text-white/70">
              Estimated on \${totalSpend} room spend across {nights} {nights === 1 ? "night" : "nights"}.
              {basePoints > rawBasePoints && " (Includes 1,000 pt guaranteed stay minimum)"}
            </p>

            {/* Free Night Meter */}
            <div className="mt-6 rounded-xl bg-white/10 p-4">
              <div className="flex items-center justify-between text-xs text-white">
                <span className="font-medium text-white/80">Progress toward Free Night (7,500 pts)</span>
                <span className="font-mono font-bold text-[var(--gh-gold)]">{progressPercent}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--gh-gold)] to-amber-300 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-white/50">
                Free nights start at just 7,500 points at thousands of Wyndham Hotels &amp; Resorts worldwide.
              </p>
            </div>

            {/* Tier Highlights */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80">
              <p className="font-bold text-white text-[11px]">{selectedTier.name} Member Perks:</p>
              <p className="mt-0.5 text-[11px] text-white/70">{selectedTier.perks}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href={WYNDHAM_REWARDS_EARN_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-white/70 underline underline-offset-4 hover:text-white"
            >
              See full program terms ↗
            </a>

            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="spring-hover inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[var(--gh-blue-deep)] shadow-sm hover:bg-white/90"
            >
              Book with Rewards
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

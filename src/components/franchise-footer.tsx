export const BOOKING_URL =
  "https://www.wyndhamhotels.com/days-inn/wildwood-florida/days-inn-wildwood-i-75/overview";

export const WYNDHAM_REWARDS_JOIN_URL = "https://www.wyndhamhotels.com/wyndham-rewards";
export const WYNDHAM_REWARDS_EARN_URL = "https://www.wyndhamhotels.com/wyndham-rewards/earn";
export const WYNDHAM_REWARDS_TERMS_URL = "https://www.wyndhamhotels.com/wyndham-rewards/terms";

export function FranchiseDisclaimer({ className }: { className?: string }) {
  return (
    <p className={className ?? "mt-3 text-[11px] leading-relaxed text-muted-foreground"}>
      Wyndham Rewards® membership is required for member-only rates and eligible point earning.
      Points are earned on qualifying stays at participating properties, subject to the{" "}
      <a
        href={WYNDHAM_REWARDS_TERMS_URL}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:opacity-80"
      >
        Wyndham Rewards Terms & Conditions
      </a>
      . Final availability, rate, taxes, fees, cancellation terms, and eligibility are confirmed on
      Wyndham.com.
    </p>
  );
}

export function FranchiseLegal() {
  return (
    <p className="text-[11px] leading-relaxed text-muted-foreground">
      This Days Inn® by Wyndham location is independently owned and operated under a franchise
      agreement. Days Inn®, Daybreak®, and Wyndham Rewards® are registered trademarks of Wyndham
      Hotel Group, LLC and/or its affiliates.
    </p>
  );
}

export const BOOKING_URL =
  "https://www.wyndhamhotels.com/days-inn/wildwood-florida/days-inn-wildwood-i-75/overview";

export function FranchiseDisclaimer({ className }: { className?: string }) {
  return (
    <p className={className ?? "mt-3 text-[11px] leading-relaxed text-muted-foreground"}>
      Must be a Wyndham Rewards® member at booking/check-in. Benefits subject to availability and
      Wyndham Rewards program terms.
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

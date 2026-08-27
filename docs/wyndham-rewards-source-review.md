# Wyndham Rewards Source Review

**Reviewed:** 2026-08-26 EDT

| Source                                                                                    | Relevant verified language                                                                                                                                                                       | Implementation consequence                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Wyndham Rewards Terms & Conditions](https://www.wyndhamhotels.com/wyndham-rewards/terms) | The program terms govern participation in Wyndham Rewards worldwide and can change over time.                                                                                                    | Keep the guest page linked to the official terms; avoid presenting the local page as the authoritative program policy.                                                                                          |
| [Earn Wyndham Rewards Points](https://www.wyndhamhotels.com/wyndham-rewards/earn)         | “For every qualified stay at most Wyndham Hotels & Resorts or participating vacation club resorts, you’ll earn 10 points per dollar or 1,000 points—whichever is more.”                          | Use **qualified stay**, **at most participating properties**, and **whichever is more** in the points claim. Link to official terms.                                                                            |
| [Best Rate Guarantee](https://www.wyndhamhotels.com/hotel-deals/best-rate-guarantee)      | The guarantee applies only to reservations made through Wyndham’s website or central reservations in the US, Canada, and EMEA; a claim has timing, rate-comparison, and availability conditions. | Do not label a hotel-specific member-rate card “Best Rate Guarantee” without a proximate official-terms link and eligibility qualifier. Prefer a neutral “Book direct through Wyndham” badge on the local page. |

## Guest-view changes selected

1. Replace the unqualified “Best Rate Guarantee” badge and “points on every stay” language with language limited to **qualifying stays** and directed to Wyndham’s official booking flow.
2. Add a “Join Wyndham Rewards” link and direct links to the current program terms and earning details.
3. State that member rates and point earning are subject to the Wyndham Rewards program terms and that qualifying-stay requirements apply.
4. Preserve correct trademark attribution and make the property’s independent-franchise disclosure explicit.
5. Avoid representing locally displayed availability or price estimates as Wyndham’s final inventory, tax-inclusive total, or a guarantee; label them as an indicative local snapshot and make the official Wyndham booking flow the source of final availability, rate, taxes, fees, and eligibility.

> This is a practical implementation review based on public Wyndham pages, not a legal clearance or a substitute for formal Wyndham brand approval.

## Local browser verification

The guest page was loaded from the local development server on 2026-08-26 EDT. The revised section rendered with visible links for the official hotel booking flow, Wyndham Rewards enrollment, earning information, and program terms. The rendered availability notice describes local availability and price as an indicative snapshot and makes Wyndham.com the source of final room, rate, tax, fee, cancellation, and eligibility details.

The temporary externally proxied preview host was rejected by the development server’s host allow-list; local browser verification via `http://localhost:4173` succeeded. This development-only host restriction was not changed in the project configuration.

## Operational UI verification

The housekeeping board was opened in its built-in demonstration mode. A one-tap status transition changed room 112 from **Vacant dirty** to **Vacant clean**; the board immediately recalculated the “To clean” count from 20 to 19, moved the room into the clean grouping, and displayed the staff-attributed confirmation message. This validates the optimistic interface path used for immediate staff feedback. The persisted queue, atomic server acknowledgment, and conflict branch are covered by the dedicated unit tests and migration added in this change.

The front-desk board was also verified in demonstration mode using representative room data. After selecting the demo staff identity, the detailed editor successfully changed room 112 from **Vacant dirty** to **Vacant clean**. The dashboard counts immediately changed from 66 clean / 15 dirty to 67 clean / 14 dirty, and the staff-attributed confirmation was shown. This validates the second operational UI path and confirms that the demo workflow no longer renders an empty board when no backend configuration is present.

All four external URLs used by the revised rewards section returned HTTP 200 during verification: the official Days Inn Wildwood booking page, Wyndham Rewards enrollment page, points-earning page, and program terms page.

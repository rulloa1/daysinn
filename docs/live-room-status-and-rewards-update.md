# Live Room Status and Wyndham Rewards Update

**Repository:** `rulloa1/daysinn`  
**Implementation:** `feat: harden live room status and rewards messaging`  
**Completed:** August 26, 2026 (EDT)

> **Compliance note.** This implementation aligns the guest-facing wording with the public Wyndham sources reviewed below. It is not formal legal advice or a substitute for Wyndham brand, franchise, or legal approval before production use.

## Outcome

The live room-status workflow is now **local-first, idempotent, conflict-aware, and audit-ready** across the Housekeeping and Front Desk boards. The prior temporary no-op queue was replaced with a durable browser queue and atomic server-side status operation. Staff receive immediate feedback, offline work remains visible, retries are safe, and stale updates are preserved for review rather than silently overwriting a newer room status.

The guest view now presents Wyndham Rewards information as **program-qualified messaging**. It directs guests to official Wyndham pages for enrollment, booking, earning details, and current terms; avoids treating an indicative local availability snapshot as Wyndham’s final price or inventory; and keeps the independent-franchise disclosure visible.

| Area                     | Delivered improvement                                                                                                                                | Guest or staff impact                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Local-first room updates | Added `room-status-sync.ts` to save each status action on-device before a network call.                                                              | A corridor connectivity loss does not cause staff work to disappear.                          |
| Atomic server write      | Added `apply_room_status_change` migration function, which version-checks the room, updates its status, and logs the audit event in one transaction. | Remote status and audit history cannot diverge through a partially completed client workflow. |
| Idempotent retry         | Uses a stable operation UUID and a unique event key.                                                                                                 | Reconnecting or retrying cannot create duplicate status events.                               |
| Explicit conflicts       | Stale writes are retained as **Needs review** and the live row is refreshed from the server.                                                         | Staff cannot unknowingly overwrite a newer room update.                                       |
| Sync visibility          | Both staff boards display room-level **Saved offline** or **Needs review** indicators, plus a retry banner.                                          | Local and live state are distinguishable.                                                     |
| Cross-board coverage     | Wired the same queue and executor into both Housekeeping and Front Desk.                                                                             | Status semantics are consistent across operations.                                            |
| Demonstration resilience | Front Desk now supplies representative in-memory rooms in demo mode when no backend is configured.                                                   | Both operational UIs can be exercised without production credentials.                         |
| Rewards language         | Replaced unqualified “Best Rate Guarantee” and “points on every stay” claims with terms-linked, qualifying-stay language.                            | Guests receive narrower, source-supported program information.                                |
| Booking transparency     | Availability results are labeled as indicative estimates before taxes and fees, with final booking terms confirmed on Wyndham.com.                   | The local page does not overstate rate, inventory, or eligibility authority.                  |

## Wyndham Rewards Guest-View Alignment

The public Wyndham Rewards earning page states that, for every qualified stay at most Wyndham Hotels & Resorts or participating vacation club resorts, members earn **10 points per dollar or 1,000 points, whichever is more**.[1] The guest view now uses that qualified-stay framing and links directly to official earning details and program terms. It also provides a direct enrollment link so prospective guests can join or sign in through Wyndham’s own flow.[2]

The prior “Best Rate Guarantee” badge was removed. Wyndham’s guarantee has specific booking-channel, geography, claim-timing, rate-comparison, and verification conditions; it should not be implied by a generic property-rate card without the related official conditions.[3] The local page instead uses **Official booking** and **Book on Wyndham.com** language, accompanied by a clear final-booking disclosure.

| Previous presentation                   | Updated presentation                                                        | Reason                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| “Best Rate Guarantee” badge             | “Official booking” badge                                                    | The official guarantee is conditional, not a blanket property-card benefit.[3] |
| “Earn points on every stay”             | “Earn points on qualifying stays”                                           | Matches the official program’s qualified-stay framing.[1]                      |
| “10 Points Per Dollar”                  | “10 points per dollar or 1,000 points per qualified stay—whichever is more” | Preserves the official alternative earning condition.[1]                       |
| “Live availability from our front desk” | “Indicative property snapshot” with final details on Wyndham.com            | Separates the pilot’s local snapshot from the official booking authority.      |
| Generic terms note                      | Terms-linked member-rate and point-earning disclosure                       | Gives guests a current official source for variable program conditions.[4]     |

## Validation Performed

All automated checks passed after implementation. A focused unit suite covers queue replacement, multi-room preservation, conflict summaries, and malformed local-storage recovery. The full repository verification command completed formatting checks, linting, type checks, tests, and a production build successfully.

| Check                          | Result                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`               | Passed                                                                                                                           |
| `git diff --check`             | Passed                                                                                                                           |
| Queue unit tests               | Passed                                                                                                                           |
| Housekeeping demo transition   | Passed: Room 112 changed from Vacant dirty to Vacant clean; the “To clean” count recalculated from 20 to 19.                     |
| Front-desk demo transition     | Passed: Room 112 changed from Vacant dirty to Vacant clean; counts recalculated from 66 clean / 15 dirty to 67 clean / 14 dirty. |
| Guest-view render              | Passed: rendered official booking, enrollment, earning, and terms links plus the new availability disclosure.                    |
| Official external destinations | Passed: the official hotel booking, Wyndham Rewards enrollment, earning, and terms URLs each returned HTTP 200.                  |

## Deployment Prerequisite

Deploy the included migration `supabase/migrations/20260826000000_room_status_sync.sql` with the application release. It adds the `operation_id` audit key and the authenticated, role-checked `apply_room_status_change` operation used by the client queue. No Wyndham, property-management, or corporate API credentials were added, requested, or used.

## References

[1]: https://www.wyndhamhotels.com/wyndham-rewards/earn "Wyndham Rewards — Earn Points"
[2]: https://www.wyndhamhotels.com/wyndham-rewards "Wyndham Rewards"
[3]: https://www.wyndhamhotels.com/hotel-deals/best-rate-guarantee "Wyndham Best Rate Guarantee"
[4]: https://www.wyndhamhotels.com/wyndham-rewards/terms "Wyndham Rewards Terms & Conditions"

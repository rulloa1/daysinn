# Housekeeping demo fixes

Base: `3c2bbe86b8943de0201a90a6680279bdc2520739` on `main`.
Branch: `fix/housekeeping-demo-readiness`.

## Implemented

- Reconciled the npm lockfile; added PGlite as a development-only database test dependency.
- Completion now uses one RPC transaction for clean status, stage clearing, and audit logging. Offline replay takes the same path. Removed the client-side second write.
- The SECURITY DEFINER RPC now validates authenticated room-assignment authority and active staff identity; audit names come from the staff table. Staff/managers and authenticated supervisors retain their existing elevated access. Regular housekeepers must use their own linked staff identity.
- Retries lock the room before checking operation idempotency and reject mismatched operation reuse. A repeat returns the current room state rather than an obsolete event status.
- Room dialogs derive their room from the current board by ID. Supervisor controls use authenticated authority instead of a selected roster member's flag.
- Refresh failures retain last-known data and display a warning. Direct writes catch network rejection and compare the reviewed updated_at before changing a room. After sync/conflict the board fetches authoritative room data.
- Failed queued requests remain visible in the retry count.
- Reserved/out-of-order rooms cannot become the next cleaning action due to an old in-progress stage.
- Map fixes prioritize DND, include the reserved legend, expose keyboard focus and accessible room search results, and remove stair-marker overlap with room controls. Landmark positions are explicitly illustrative.
- Shift start works with unavailable local storage; completed-room count only includes clean rooms.

## Deployment order — not executed

1. Apply `supabase/migrations/20261018080000_housekeeping_atomic_completion.sql` to an isolated staging database first. Confirm housekeeper accounts have the intended active `staff_members.user_id` linkage. A selected roster name alone is not authority. Shared desk/manager accounts retain their role-based workflow.
2. Exercise real RLS and the RPC with housekeeper, supervisor, staff, manager, and viewer sessions. The PGlite tests execute the actual migration but use a minimal supporting schema, not the entire deployed Supabase schema.
3. Deploy the frontend only after the migration succeeds. Older clients remain compatible because the RPC signature is unchanged; this frontend requires the atomic stage-clear behavior.
4. Perform the signed-in phone/desktop and two-device demo checks below before merging/releasing. No production database, deployment, or main-branch change was performed by this work.

## Validation

- Node 22: repaired lockfile clean installation, production build and TypeScript check passed.
- Active Vitest suite passes, including migration tests for atomic updates, idempotent replay, current-state return, conflicts, assignment/identity denial, manager attribution, inactive/viewer denial, and rollback if audit insertion fails.
- Changed application/test files pass ESLint and repository Prettier formatting.
- Full repository lint/format checks still fail on inherited issues outside this patch: 43 pre-existing formatting failures and six non-format lint errors in preview auth storage and email-template files. These are not suppressed or reformatted as part of the housekeeping changes.
- Credential-gated integration/E2E tests are skipped; no isolated Supabase test credentials were available. Signed-in visual/mobile verification and actual migration deployment remain outstanding.

## Demo acceptance

- Claim an unassigned dirty room, start it, finish it, and verify clean status plus cleared stage and one audit event on another session.
- Drop the connection during completion; confirm pending feedback, recovery, and idempotent replay without a half-finished room.
- Change the same room on another device; verify the newer state survives and a conflict asks the operator to review refreshed data.
- Reject a board refresh and a direct write; confirm last-known data, visible warning, and rollback.
- Verify DND, reserved, and out-of-order route exclusions.
- At phone and desktop widths, search/select room 108 and a room outside the illustration; test zero results, keyboard focus/activation, and live dialog updates.
- Confirm map landmarks with the hotel before describing it as an accurate physical plan.

## Remaining known limits

The local queue remains device-scoped (shared with front desk); it is not a cross-device job scheduler. Authorization is enforced server-side when replayed. Realtime refreshes can temporarily lag; version checks protect writes. This is not a PMS integration. The draft PR should stay unmerged until staging authorization and mobile/two-device checks pass and inherited quality-gate failures are resolved separately.

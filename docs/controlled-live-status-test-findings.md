# Controlled Live Room-Status Test Findings

## Access verification — 2026-08-27 EDT

The deployed `https://daysinn.lovable.app/housekeeping` route is reachable. Its unauthenticated guard displays only the Housekeeping heading, the instruction “Sign in with the property account first, then pick your name,” and a link to `/staff`. No room data is exposed without authentication.

The public `https://daysinn.lovable.app/staff` URL currently resolves to the guest landing page instead of the expected staff sign-in screen, despite the checked-out source defining `createFileRoute("/staff")`. Consequently, the live Housekeeping screen cannot currently obtain an authenticated property session through the deployed staff link.

The session’s Supabase integration configuration and direct integration call both returned a `403 Forbidden` access error. This prevents the agent from using the controlled server-side read/write path to select, mutate, and restore a live test room. No production records were read or changed during these failed access checks.

## No-mock guard correction

The local checked-out `src/integrations/supabase/client.ts` contained a generated fallback returning empty, successful query data under a `createMockSupabaseClient` implementation. This violates the requirement that operations never use mock data. It has been changed locally to a fail-closed unavailable-data client that returns explicit errors and retains a signed-out state when live configuration is absent. TypeScript type checking passed after that correction. The full release verification and deployment checks remain pending.

## Test status

A genuine Housekeeping completion and Front Desk real-time receipt test is **blocked**, not completed. Completing it requires either: (a) an authorized property staff session with a valid `user_roles` entry and a selected `staff_members` identity, or (b) restored agent access to the project’s live backend for a clearly controlled backend-only plumbing test. Any state change will be restored to its exact prior status and timestamp version will be recorded; audit events may remain as a transparent record of the test.

## Production client configuration verification

Following the Housekeeping screen’s **Go to staff sign in** link through the live application router loads the intended `/staff` page. The deployed page explicitly displays: “The live data service is not configured.” Its sign-in controls are disabled. This establishes that the public production build currently lacks the required Supabase URL and publishable key at build/runtime, so it cannot authenticate a staff user, load live room data, or subscribe to real-time room-status events.

This is separate from the browser’s initial direct-navigation rendering of the guest page: application-router navigation reaches the correct staff route, but the route correctly fails closed because its live backend configuration is absent. No credentials were entered and no production data was modified.

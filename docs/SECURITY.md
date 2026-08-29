# Security model — Days Inn Hub

## Roles

Roles live in `public.user_roles` (`manager`, `staff`, `viewer`) and are never
stored on a profile or user record. All authorization is enforced by row-level
security in the database and by server-function guards
(`assertManager` / `assertStaff`), not by React UI checks.

| Data                    | manager           | staff      | viewer    | signed-out  |
| ----------------------- | ----------------- | ---------- | --------- | ----------- |
| Rooms                   | read/write        | read/write | read only | none        |
| Requests                | read/write/delete | read/write | read only | create only |
| Request notes           | read/write        | read/write | read only | none        |
| Room status events      | read/write        | read/write | read only | none        |
| Bookings                | read/write        | read/write | none      | none        |
| Guest messages          | read/write        | read/write | none      | none        |
| Staff members / invites | manage            | limited    | none      | none        |
| Audit events            | read              | none       | none      | none        |

Users with no role row can read nothing. A guest who somehow obtains a
Supabase session therefore still sees no operational data.

## Sensitive columns

- `rooms.door_pin` / `door_pin_set_at` — clients cannot update them; the front
  desk reads a PIN only through the staff-gated `readDoorPin` server function,
  which writes an audit event on every read.
- `staff_members.pin` — `SELECT` and `UPDATE` are revoked from `authenticated`.
  PINs are only checked server-side by `verifyStaffPin`.

## Guest access

Guests never receive a Supabase session. Every guest action runs through a
server function that re-verifies room number + reservation last name on each
call, using the service-role client on the server only.

- Failures return one generic message; they never reveal whether the room or
  the name was wrong.
- QR sign-in tokens are single-use, room-bound and short-lived
  (`QR_TTL_MINUTES`); consuming one is an atomic conditional update.
- Sessions expire at the earlier of `GUEST_SESSION_HOURS` and the checkout
  date. Chat and the digital key stop working past checkout.
- Rate limits per room, recorded in `public.guest_auth_attempts`: sign-in
  8 / 15 min, requests 12 / 10 min, messages 30 / 10 min, thread reads
  120 / 10 min.
- Guests can only ever read rows scoped to their own verified room.

## Audit trail

`public.audit_events` (manager-readable only) is written by:

- database triggers on `rooms`, `requests` and `bookings` — same transaction as
  the change, so the record cannot be lost;
- server functions for role grants/revocations, QR issuance/revocation, and
  digital-key issue / clear / view.

## Secrets

The service-role key is only read inside `client.server.ts` and is never
imported at module scope of a client-reachable file. See `.env.example` for the
full list of required variables. The push-dispatch shared secret was rotated and
moved out of migration source into `public.internal_secrets`, which is readable
only by `service_role` and `SECURITY DEFINER` functions.

## Known accepted findings

- `public.guest_auth_attempts` and `public.internal_secrets` have RLS enabled
  with no policies — deny-all by design; only `service_role` touches them.
- Leaked-password protection is disabled at the owner's request so simple staff
  passwords can be set. Re-enable before public launch.

## Password policy (pilot readiness)

- Breached-password protection (HIBP) is enabled on the auth service; weak or
  known-leaked passwords are rejected at sign-up, reset, and change.
- Managers can force a fleet-wide reset from Role management → Team access.
  It writes a row per role-holding account into
  `public.password_reset_requirements` and emails a reset link.
- That table is the enforcement point, and it is server-owned: an account may
  `SELECT` its own row, but `authenticated` holds no INSERT/UPDATE/DELETE
  grant, so only `service_role` can raise or clear a requirement. The flag was
  previously kept in `user_metadata`, which the account itself can rewrite.
- `assertManager` / `assertStaff` / `assertHousekeeperOrStaff` refuse while a
  requirement is pending, so every guarded server function is closed to a
  flagged account. `PasswordResetGate` on `/staff` is a convenience surface,
  not the boundary; skipping it gains nothing. Both the guard lookup and the
  gate fail closed if the requirement cannot be read.
- `completePasswordReset` is the only path out. It sets the new password via
  the auth service's user-facing endpoint, as the caller, and clears the
  requirement _only_ if that call succeeded — so the minimum length and the
  breached-password check are applied by the auth service, and the requirement
  cannot be cleared without a real password change.
- Both the force-reset and each completion are written to `audit_events`.

## Guest name masking

- `rooms` and `requests` are readable directly only by staff and managers.
- Viewers read through `public.rooms_board` / `public.requests_board`, which
  gate rows on holding any team role and replace `guest_name` with a first
  initial (e.g. `M. •••`) for anyone who is not staff or manager.
- These two views are intentionally `security_invoker = off` so the role check
  and masking cannot be bypassed by the caller; each carries its own explicit
  role predicate. The Supabase "Security Definer View" lint on them is accepted.
- Guest access to their own room is unaffected: it runs server-side through
  verified guest sessions, not through these views.

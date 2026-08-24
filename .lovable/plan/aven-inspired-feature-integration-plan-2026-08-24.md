# Aven-Inspired Feature Integration Plan

## Goal
Add three Aven-Hospitality-style capabilities to the existing Days Inn Wildwood operations app without disrupting current staff/housekeeping/front-desk workflows.

## Features to build

### 1. AI Staff Assistant in `/staff`
- Add a collapsible "Ask Ops" chat panel to the staff portal.
- Accept natural-language commands from managers/staff.
- Parse intent locally and route to existing MCP tools (`list_rooms`, `update_room_status`, `list_requests`, `update_request_status`, `property_summary`).
- Support examples:
  - "Show dirty rooms on floor 2" → `list_rooms` with filters.
  - "Mark room 105 clean" → `update_room_status`.
  - "What requests are open?" → `list_requests`.
  - "Assign Maria rooms 101–110 for tomorrow day shift" → future schedule + assignment write.
- Keep all mutations gated by existing RBAC (`useStaffRole`).
- Store assistant conversation thread in component state only (no new table needed for v1).

### 2. Analytics Dashboard on `/front-desk`
- Add a new "Analytics" tab/card to the front-desk board.
- Charts (using a lightweight charting library):
  - Occupancy % over last 7/30 days.
  - Room status breakdown (clean / dirty / DND / OOO / occupied).
  - Average turnaround time (dirty → clean) by housekeeper.
  - Request volume and resolution time by category.
- Data sourced from existing tables: `rooms`, `room_status_events`, `requests`, `staff_schedules`, `staff_shifts`.
- Add server functions to aggregate data safely (public reads for occupancy, auth-gated reads for staff performance).
- Keep CSV export as a fallback/action below charts.

### 3. Guest CRM / Stay Profiles
- New `guest_profiles` table:
  - `id uuid primary key`
  - `first_name`, `last_name`
  - `phone`, `email` (optional)
  - `preferences jsonb` (e.g., extra pillows, quiet room, late checkout)
  - `notes text`
  - `created_at`, `updated_at`
- Link profiles to `bookings` via `guest_profile_id`.
- On guest sign-in (`/checkin` or `/room`), surface prior preferences and notes if matched by last name + room.
- Allow front-desk staff to view/edit guest profiles from `/front-desk` bookings list.
- RLS: guests can read their own profile by booking linkage; staff/managers can read/update all.

## Technical notes
- Use existing `createServerFn` patterns; no new external APIs.
- Reuse MCP tool wrappers where possible for the AI assistant.
- For charts, prefer a small dependency like `recharts` or `chart.js` with a wrapper component.
- Add GRANT statements for `guest_profiles` and enable RLS.
- Update route `head()` metadata for any new public-facing routes.

## Out of scope
- OTA/channel manager connections (Aven's core CRS business) — requires contracts and is not practical for a single-property pilot.
- Revenue management / dynamic pricing engine.
- Multi-property support (would need a larger schema refactor).

## Acceptance criteria
- Manager can open the staff AI assistant, type "show dirty rooms floor 2", and see filtered results.
- Front-desk analytics tab renders charts without errors on demo data.
- Guest profile persists across stays and is visible to front desk and to the guest on `/room`.

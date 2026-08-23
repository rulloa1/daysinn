-- Phase 1: restrict read access on operational tables to role-holders only.

DROP POLICY IF EXISTS "Staff can view bookings" ON public.bookings;
CREATE POLICY "Staff and managers can view bookings"
ON public.bookings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager')));

DROP POLICY IF EXISTS "Staff can view guest messages" ON public.guest_messages;
CREATE POLICY "Staff and managers can view guest messages"
ON public.guest_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager')));

DROP POLICY IF EXISTS "Staff can view requests" ON public.requests;
CREATE POLICY "Staff team can view requests"
ON public.requests FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager','viewer')));

DROP POLICY IF EXISTS "Staff can view request notes" ON public.request_notes;
CREATE POLICY "Staff team can view request notes"
ON public.request_notes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager','viewer')));

DROP POLICY IF EXISTS "Staff can view room status events" ON public.room_status_events;
CREATE POLICY "Staff team can view room status events"
ON public.room_status_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager','viewer')));

DROP POLICY IF EXISTS "Staff can view rooms" ON public.rooms;
CREATE POLICY "Staff team can view rooms"
ON public.rooms FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager','viewer')));

-- Door PINs are sensitive: only managers may read or write them directly.
REVOKE UPDATE (door_pin, door_pin_set_at) ON public.rooms FROM authenticated;
-- Staff PINs likewise stay out of ordinary client reads.
REVOKE SELECT (pin) ON public.staff_members FROM authenticated;
REVOKE UPDATE (pin) ON public.staff_members FROM authenticated;

-- Audit trail for sensitive operations (door keys, QR issuance, role changes).
CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  actor_user_id uuid,
  actor_name text,
  room text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view audit events"
ON public.audit_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'manager'));

CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON public.audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON public.audit_events (entity, entity_id);

-- Guest sign-in abuse protection: server-side attempt log.
CREATE TABLE IF NOT EXISTS public.guest_auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  identifier text NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.guest_auth_attempts TO service_role;
ALTER TABLE public.guest_auth_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS guest_auth_attempts_lookup_idx
  ON public.guest_auth_attempts (scope, identifier, created_at DESC);

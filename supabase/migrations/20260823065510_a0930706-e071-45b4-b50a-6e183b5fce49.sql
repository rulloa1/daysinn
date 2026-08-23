CREATE OR REPLACE FUNCTION public.mask_guest_name(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN name IS NULL OR btrim(name) = '' THEN NULL
    ELSE upper(substr(btrim(name), 1, 1)) || '. ' || repeat('•', 3)
  END
$$;

CREATE OR REPLACE VIEW public.rooms_board
WITH (security_invoker = off) AS
SELECT
  r.id,
  r.number,
  r.floor,
  r.bed_type,
  r.status,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
    ) THEN r.guest_name
    ELSE public.mask_guest_name(r.guest_name)
  END AS guest_name,
  r.check_in,
  r.check_out,
  r.original_check_out,
  r.notes,
  r.dnd,
  r.extended_stay,
  r.assigned_staff_id,
  r.assigned_name,
  r.assigned_at,
  r.created_at,
  r.updated_at
FROM public.rooms r
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
);

CREATE OR REPLACE VIEW public.requests_board
WITH (security_invoker = off) AS
SELECT
  q.id,
  q.room,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
    ) THEN q.guest_name
    ELSE public.mask_guest_name(q.guest_name)
  END AS guest_name,
  q.type,
  q.details,
  q.status,
  q.created_at,
  q.updated_at,
  q.started_at,
  q.started_by_name,
  q.resolved_at,
  q.resolved_by_name,
  q.response_seconds
FROM public.requests q
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
);

REVOKE ALL ON public.rooms_board FROM anon;
REVOKE ALL ON public.requests_board FROM anon;
GRANT SELECT ON public.rooms_board TO authenticated;
GRANT SELECT ON public.requests_board TO authenticated;
GRANT SELECT ON public.rooms_board TO service_role;
GRANT SELECT ON public.requests_board TO service_role;

DROP POLICY IF EXISTS "Staff team can view rooms" ON public.rooms;
CREATE POLICY "Staff and managers can view rooms"
ON public.rooms FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
));

DROP POLICY IF EXISTS "Staff team can view requests" ON public.requests;
CREATE POLICY "Staff and managers can view requests"
ON public.requests FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
));
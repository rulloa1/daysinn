DROP VIEW IF EXISTS public.rooms_board;
DROP VIEW IF EXISTS public.requests_board;

CREATE OR REPLACE FUNCTION public.rooms_board()
RETURNS TABLE (
  id uuid,
  number text,
  floor integer,
  bed_type text,
  status public.room_status,
  guest_name text,
  check_in date,
  check_out date,
  original_check_out date,
  notes text,
  dnd boolean,
  extended_stay boolean,
  assigned_staff_id uuid,
  assigned_name text,
  assigned_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id, r.number, r.floor, r.bed_type, r.status,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])
    ) THEN r.guest_name ELSE public.mask_guest_name(r.guest_name) END,
    r.check_in, r.check_out, r.original_check_out, r.notes, r.dnd, r.extended_stay,
    r.assigned_staff_id, r.assigned_name, r.assigned_at, r.created_at, r.updated_at
  FROM public.rooms r
  WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.requests_board()
RETURNS TABLE (
  id uuid,
  room text,
  guest_name text,
  type text,
  details text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  started_by_name text,
  resolved_at timestamptz,
  resolved_by_name text,
  response_seconds integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id, q.room,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])
    ) THEN q.guest_name ELSE public.mask_guest_name(q.guest_name) END,
    q.type, q.details, q.status, q.created_at, q.updated_at,
    q.started_at, q.started_by_name, q.resolved_at, q.resolved_by_name, q.response_seconds
  FROM public.requests q
  WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.rooms_board() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.requests_board() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rooms_board() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.requests_board() TO authenticated, service_role;

-- Guest request submissions: validate payload instead of allowing arbitrary writes
DROP POLICY IF EXISTS "Anyone can submit a request" ON public.requests;
CREATE POLICY "Guests can submit a validated request"
ON public.requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(room)) BETWEEN 1 AND 10
  AND length(btrim(type)) BETWEEN 1 AND 80
  AND (details IS NULL OR length(details) <= 1000)
  AND (guest_name IS NULL OR length(btrim(guest_name)) <= 80)
  AND status = 'new'
  AND resolved_at IS NULL
  AND started_at IS NULL
  AND resolved_by_staff_id IS NULL
  AND started_by_staff_id IS NULL
  AND response_seconds IS NULL
);

-- user_roles: explicit manager-only writes, no self-assignment, no anon access
REVOKE ALL ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "Managers can grant roles" ON public.user_roles;
CREATE POLICY "Managers can grant roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id <> auth.uid()
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager'::app_role)
);

DROP POLICY IF EXISTS "Managers can update roles" ON public.user_roles;
CREATE POLICY "Managers can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  user_id <> auth.uid()
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager'::app_role)
)
WITH CHECK (
  user_id <> auth.uid()
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager'::app_role)
);

DROP POLICY IF EXISTS "Managers can revoke roles" ON public.user_roles;
CREATE POLICY "Managers can revoke roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  user_id <> auth.uid()
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager'::app_role)
);
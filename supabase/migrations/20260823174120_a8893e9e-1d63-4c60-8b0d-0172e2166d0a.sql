-- Housekeeper access: same operational reach as staff for rooms/requests, no booking or PII escalation
ALTER POLICY "Staff and managers can view rooms" ON public.rooms
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])));
ALTER POLICY "Staff and managers can update rooms" ON public.rooms
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])));
ALTER POLICY "Staff and managers can view requests" ON public.requests
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])));
ALTER POLICY "Staff and managers can update requests" ON public.requests
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])));
ALTER POLICY "Staff and managers can view staff members" ON public.staff_members
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])));
ALTER POLICY "Staff can log room status events" ON public.room_status_events
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])));
ALTER POLICY "Staff team can view room status events" ON public.room_status_events
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'viewer'::app_role,'housekeeper'::app_role])));

-- Board functions: allow housekeepers, keep guest names masked for them
CREATE OR REPLACE FUNCTION public.rooms_board()
 RETURNS TABLE(id uuid, number text, floor integer, bed_type text, status room_status, guest_name text, check_in date, check_out date, original_check_out date, notes text, dnd boolean, extended_stay boolean, assigned_staff_id uuid, assigned_name text, assigned_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    r.id, r.number, r.floor, r.bed_type, r.status,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])
    ) THEN r.guest_name ELSE public.mask_guest_name(r.guest_name) END,
    r.check_in, r.check_out, r.original_check_out, r.notes, r.dnd, r.extended_stay,
    r.assigned_staff_id, r.assigned_name, r.assigned_at, r.created_at, r.updated_at
  FROM public.rooms r
  WHERE auth.uid() IS NOT NULL
    AND (SELECT auth.jwt() ->> 'role') = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'viewer'::app_role,'housekeeper'::app_role])
    );
$function$;

CREATE OR REPLACE FUNCTION public.requests_board()
 RETURNS TABLE(id uuid, room text, guest_name text, type text, details text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, started_at timestamp with time zone, started_by_name text, resolved_at timestamp with time zone, resolved_by_name text, response_seconds integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    q.id, q.room,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])
    ) THEN q.guest_name ELSE public.mask_guest_name(q.guest_name) END,
    q.type, q.details, q.status, q.created_at, q.updated_at,
    q.started_at, q.started_by_name, q.resolved_at, q.resolved_by_name, q.response_seconds
  FROM public.requests q
  WHERE auth.uid() IS NOT NULL
    AND (SELECT auth.jwt() ->> 'role') = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'viewer'::app_role,'housekeeper'::app_role])
    );
$function$;

-- Shift clock-in / clock-out log
CREATE TABLE public.staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  staff_name text NOT NULL,
  department text NOT NULL DEFAULT 'housekeeping',
  clock_in_at timestamptz NOT NULL DEFAULT now(),
  clock_out_at timestamptz,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.staff_shifts TO authenticated;
GRANT ALL ON public.staff_shifts TO service_role;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view shifts" ON public.staff_shifts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'viewer'::app_role,'housekeeper'::app_role])));
CREATE POLICY "Team can clock in" ON public.staff_shifts FOR INSERT TO authenticated
  WITH CHECK (clock_out_at IS NULL AND duration_seconds IS NULL AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])));
CREATE POLICY "Team can clock out" ON public.staff_shifts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'housekeeper'::app_role])));

CREATE INDEX staff_shifts_member_idx ON public.staff_shifts (staff_member_id, clock_in_at DESC);

CREATE OR REPLACE FUNCTION public.set_shift_duration()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.clock_out_at IS NOT NULL THEN
    NEW.duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (NEW.clock_out_at - NEW.clock_in_at))::int);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER staff_shifts_duration BEFORE INSERT OR UPDATE ON public.staff_shifts
FOR EACH ROW EXECUTE FUNCTION public.set_shift_duration();
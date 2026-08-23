CREATE OR REPLACE FUNCTION public.requests_board()
 RETURNS TABLE(id uuid, room text, guest_name text, type text, details text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, started_at timestamp with time zone, started_by_name text, resolved_at timestamp with time zone, resolved_by_name text, response_seconds integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
        AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'viewer'::app_role])
    );
$function$;

CREATE OR REPLACE FUNCTION public.rooms_board()
 RETURNS TABLE(id uuid, number text, floor integer, bed_type text, status room_status, guest_name text, check_in date, check_out date, original_check_out date, notes text, dnd boolean, extended_stay boolean, assigned_staff_id uuid, assigned_name text, assigned_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
        AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role,'viewer'::app_role])
    );
$function$;

REVOKE ALL ON FUNCTION public.requests_board() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rooms_board() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.requests_board() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rooms_board() TO authenticated;
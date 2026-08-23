CREATE OR REPLACE FUNCTION public.current_staff_member_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id FROM public.staff_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = auth.uid() AND is_supervisor AND active
  );
$$;
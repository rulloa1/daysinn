ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS is_supervisor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS staff_members_user_id_key
  ON public.staff_members(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.current_staff_member_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.staff_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = auth.uid() AND is_supervisor AND active
  );
$$;

REVOKE EXECUTE ON FUNCTION public.current_staff_member_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_supervisor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_staff_member_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_supervisor() TO authenticated;

-- Housekeepers only see their own rooms (or unassigned ones); supervisors,
-- staff and managers keep the full board.
DROP POLICY IF EXISTS "Staff and managers can view rooms" ON public.rooms;
CREATE POLICY "Room visibility by role" ON public.rooms
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'housekeeper'::app_role
    )
    AND (
      public.is_supervisor()
      OR assigned_staff_id IS NULL
      OR assigned_staff_id = public.current_staff_member_id()
    )
  )
);

DROP POLICY IF EXISTS "Staff and managers can update rooms" ON public.rooms;
CREATE POLICY "Room updates by role" ON public.rooms
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'housekeeper'::app_role
    )
    AND (
      public.is_supervisor()
      OR assigned_staff_id IS NULL
      OR assigned_staff_id = public.current_staff_member_id()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role, 'housekeeper'::app_role])
  )
);

CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  staff_name text NOT NULL,
  department text NOT NULL DEFAULT 'housekeeping',
  work_date date NOT NULL,
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '16:00',
  notes text,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_member_id, work_date, start_time)
);

CREATE INDEX IF NOT EXISTS staff_schedules_date_idx ON public.staff_schedules(work_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_schedules TO authenticated;
GRANT ALL ON public.staff_schedules TO service_role;

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedule visibility" ON public.staff_schedules
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR public.is_supervisor()
  OR staff_member_id = public.current_staff_member_id()
);

CREATE POLICY "Supervisors can create schedules" ON public.staff_schedules
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR public.is_supervisor()
);

CREATE POLICY "Supervisors can edit schedules" ON public.staff_schedules
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR public.is_supervisor()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR public.is_supervisor()
);

CREATE POLICY "Supervisors can delete schedules" ON public.staff_schedules
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR public.is_supervisor()
);

CREATE TRIGGER staff_schedules_set_updated_at
BEFORE UPDATE ON public.staff_schedules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
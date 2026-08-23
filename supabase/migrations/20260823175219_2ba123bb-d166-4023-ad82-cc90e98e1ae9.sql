CREATE TABLE IF NOT EXISTS public.shift_room_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.staff_schedules(id) ON DELETE CASCADE,
  staff_member_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  staff_name text NOT NULL,
  work_date date NOT NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_number text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, room_number)
);

CREATE INDEX IF NOT EXISTS shift_room_assignments_date_idx ON public.shift_room_assignments(work_date);
CREATE INDEX IF NOT EXISTS shift_room_assignments_schedule_idx ON public.shift_room_assignments(schedule_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_room_assignments TO authenticated;
GRANT ALL ON public.shift_room_assignments TO service_role;

ALTER TABLE public.shift_room_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shift rooms visibility" ON public.shift_room_assignments
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

CREATE POLICY "Supervisors manage shift rooms insert" ON public.shift_room_assignments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR public.is_supervisor()
);

CREATE POLICY "Supervisors manage shift rooms update" ON public.shift_room_assignments
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

CREATE POLICY "Supervisors manage shift rooms delete" ON public.shift_room_assignments
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  )
  OR public.is_supervisor()
);
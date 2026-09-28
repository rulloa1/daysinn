DROP POLICY IF EXISTS "Room updates by role" ON public.rooms;
CREATE POLICY "Room updates by role" ON public.rooms FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager'))
  OR (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'housekeeper')
    AND (public.is_supervisor() OR assigned_staff_id IS NULL OR assigned_staff_id = public.current_staff_member_id())
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager'))
  OR (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'housekeeper')
    AND (public.is_supervisor() OR assigned_staff_id IS NULL OR assigned_staff_id = public.current_staff_member_id())
  )
);
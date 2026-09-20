DROP POLICY IF EXISTS "Staff can view DND acknowledgements" ON public.dnd_acknowledgements;
DROP POLICY IF EXISTS "Staff can record DND acknowledgements" ON public.dnd_acknowledgements;

CREATE POLICY "Staff can view DND acknowledgements"
  ON public.dnd_acknowledgements FOR SELECT TO authenticated
  USING (public.current_staff_member_id() IS NOT NULL);

CREATE POLICY "Staff can record DND acknowledgements"
  ON public.dnd_acknowledgements FOR INSERT TO authenticated
  WITH CHECK (
    acknowledged_by_user_id = auth.uid()
    AND public.current_staff_member_id() IS NOT NULL
  );
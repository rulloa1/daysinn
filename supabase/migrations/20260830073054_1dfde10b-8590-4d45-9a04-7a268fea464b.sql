CREATE TABLE public.dnd_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room text NOT NULL,
  dnd_set_at timestamptz,
  acknowledged_by_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  acknowledged_by_name text,
  acknowledged_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX dnd_acknowledgements_room_idx ON public.dnd_acknowledgements (room, acknowledged_at DESC);

GRANT SELECT, INSERT ON public.dnd_acknowledgements TO authenticated;
GRANT ALL ON public.dnd_acknowledgements TO service_role;

ALTER TABLE public.dnd_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view DND acknowledgements"
  ON public.dnd_acknowledgements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can record DND acknowledgements"
  ON public.dnd_acknowledgements FOR INSERT TO authenticated WITH CHECK (true);
CREATE TABLE public.guest_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room text NOT NULL,
  body text NOT NULL,
  sender text NOT NULL DEFAULT 'guest',
  author_name text,
  author_staff_id uuid REFERENCES public.staff_members(id),
  read_by_staff boolean NOT NULL DEFAULT false,
  read_by_guest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.guest_messages TO authenticated;
GRANT ALL ON public.guest_messages TO service_role;

ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view guest messages"
  ON public.guest_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and managers can send guest messages"
  ON public.guest_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));

CREATE POLICY "Staff and managers can update guest messages"
  ON public.guest_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));

CREATE INDEX guest_messages_room_created_idx ON public.guest_messages (room, created_at DESC);

ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS door_pin text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS door_pin_set_at timestamptz;
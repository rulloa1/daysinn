ALTER TYPE public.room_status ADD VALUE IF NOT EXISTS 'occupied_dnd';
ALTER TYPE public.room_status ADD VALUE IF NOT EXISTS 'reserved';

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL,
  room text NOT NULL,
  phone text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff and managers can add bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));
CREATE POLICY "Staff and managers can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role]))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));
CREATE POLICY "Staff and managers can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));

CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
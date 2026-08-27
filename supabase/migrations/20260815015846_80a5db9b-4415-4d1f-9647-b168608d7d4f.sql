CREATE TYPE public.room_status AS ENUM ('occupied','vacant_clean','vacant_dirty','out_of_order');

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  floor int NOT NULL DEFAULT 1,
  bed_type text NOT NULL DEFAULT 'Queen',
  status public.room_status NOT NULL DEFAULT 'vacant_clean',
  guest_name text,
  check_in date,
  check_out date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff and managers can update rooms" ON public.rooms FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'staff'::app_role) OR has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'staff'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE POLICY "Managers can insert rooms" ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'manager'::app_role));
CREATE POLICY "Managers can delete rooms" ON public.rooms FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'manager'::app_role));

CREATE TRIGGER rooms_set_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

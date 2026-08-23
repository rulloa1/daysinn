CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pin text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
GRANT ALL ON public.staff_members TO service_role;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view staff members" ON public.staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can add staff members" ON public.staff_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));
CREATE POLICY "Staff can update staff members" ON public.staff_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role]))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));
CREATE POLICY "Managers can delete staff members" ON public.staff_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager'::app_role));
CREATE TRIGGER staff_members_set_updated_at BEFORE UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.room_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  old_status room_status,
  new_status room_status NOT NULL,
  staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  staff_name text,
  changed_by uuid,
  previous_changed_at timestamptz,
  duration_seconds integer,
  is_turnover boolean NOT NULL DEFAULT false,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.room_status_events TO authenticated;
GRANT ALL ON public.room_status_events TO service_role;
ALTER TABLE public.room_status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view room status events" ON public.room_status_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can log room status events" ON public.room_status_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));

CREATE INDEX IF NOT EXISTS room_status_events_room_idx ON public.room_status_events (room_number, changed_at DESC);
CREATE INDEX IF NOT EXISTS room_status_events_changed_at_idx ON public.room_status_events (changed_at DESC);
CREATE INDEX IF NOT EXISTS room_status_events_turnover_idx ON public.room_status_events (is_turnover, changed_at DESC);

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_by_name text,
  ADD COLUMN IF NOT EXISTS response_seconds integer;

CREATE INDEX IF NOT EXISTS requests_resolved_at_idx ON public.requests (resolved_at DESC);
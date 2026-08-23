ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_by_staff_id uuid REFERENCES public.staff_members(id),
  ADD COLUMN IF NOT EXISTS started_by_name text;

CREATE TABLE IF NOT EXISTS public.request_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  body text,
  status_from text,
  status_to text,
  author_staff_id uuid REFERENCES public.staff_members(id),
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS request_notes_request_idx ON public.request_notes(request_id, created_at DESC);

GRANT SELECT, INSERT ON public.request_notes TO authenticated;
GRANT ALL ON public.request_notes TO service_role;

ALTER TABLE public.request_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view request notes" ON public.request_notes;
CREATE POLICY "Staff can view request notes" ON public.request_notes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff and managers can add request notes" ON public.request_notes;
CREATE POLICY "Staff and managers can add request notes" ON public.request_notes
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
  ));
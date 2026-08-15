CREATE TABLE public.requests (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  guest_name text,
  type text not null,
  details text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT INSERT ON public.requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a request" ON public.requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view requests" ON public.requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update requests" ON public.requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff can delete requests" ON public.requests FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER requests_updated_at BEFORE UPDATE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
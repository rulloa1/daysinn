CREATE TABLE public.room_qr_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX room_qr_tokens_room_idx ON public.room_qr_tokens (room, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.room_qr_tokens TO authenticated;
GRANT ALL ON public.room_qr_tokens TO service_role;

ALTER TABLE public.room_qr_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view room qr tokens"
ON public.room_qr_tokens FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
));

CREATE POLICY "Staff can create room qr tokens"
ON public.room_qr_tokens FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
));

CREATE POLICY "Staff can revoke room qr tokens"
ON public.room_qr_tokens FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role])
));

CREATE TRIGGER room_qr_tokens_set_updated_at
BEFORE UPDATE ON public.room_qr_tokens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
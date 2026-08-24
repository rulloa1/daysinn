CREATE TABLE public.guest_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  preferences jsonb NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX guest_profiles_email_idx ON public.guest_profiles (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX guest_profiles_phone_idx ON public.guest_profiles (phone) WHERE phone IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.guest_profiles TO authenticated;
GRANT ALL ON public.guest_profiles TO service_role;

ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view guest profiles"
  ON public.guest_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['manager'::public.app_role, 'staff'::public.app_role, 'viewer'::public.app_role, 'housekeeper'::public.app_role])
    )
  );

CREATE POLICY "Managers and staff can manage guest profiles"
  ON public.guest_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['manager'::public.app_role, 'staff'::public.app_role])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['manager'::public.app_role, 'staff'::public.app_role])
    )
  );

CREATE TABLE public.guest_stays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_profile_id uuid NOT NULL REFERENCES public.guest_profiles(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  check_in date NOT NULL,
  check_out date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX guest_stays_profile_idx ON public.guest_stays (guest_profile_id);

GRANT SELECT, INSERT, UPDATE ON public.guest_stays TO authenticated;
GRANT ALL ON public.guest_stays TO service_role;

ALTER TABLE public.guest_stays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view guest stays"
  ON public.guest_stays
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['manager'::public.app_role, 'staff'::public.app_role, 'viewer'::public.app_role, 'housekeeper'::public.app_role])
    )
  );

CREATE POLICY "Managers and staff can manage guest stays"
  ON public.guest_stays
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['manager'::public.app_role, 'staff'::public.app_role])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['manager'::public.app_role, 'staff'::public.app_role])
    )
  );

CREATE OR REPLACE FUNCTION public.update_guest_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER guest_profiles_updated_at
  BEFORE UPDATE ON public.guest_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guest_updated_at();

CREATE TRIGGER guest_stays_updated_at
  BEFORE UPDATE ON public.guest_stays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guest_updated_at();

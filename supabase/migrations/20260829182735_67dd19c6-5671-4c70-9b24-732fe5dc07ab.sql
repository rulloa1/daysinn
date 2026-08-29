CREATE TABLE IF NOT EXISTS public.password_reset_requirements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  required_at timestamptz NOT NULL DEFAULT now(),
  required_by uuid,
  completed_at timestamptz
);
GRANT SELECT ON public.password_reset_requirements TO authenticated;
GRANT ALL ON public.password_reset_requirements TO service_role;
ALTER TABLE public.password_reset_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own reset requirement" ON public.password_reset_requirements;
CREATE POLICY "Users can see their own reset requirement"
  ON public.password_reset_requirements FOR SELECT TO authenticated
  USING (user_id = auth.uid());
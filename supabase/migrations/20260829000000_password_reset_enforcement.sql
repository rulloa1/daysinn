-- Forced staff password resets were tracked in auth.users.raw_user_meta_data,
-- which Supabase exposes as user_metadata. Any signed-in user can rewrite that
-- with supabase.auth.updateUser({ data: ... }), so a flagged account could
-- clear its own requirement and walk straight past PasswordResetGate.
--
-- The requirement now lives here instead: an account may read its own row, but
-- there is no INSERT/UPDATE/DELETE grant for `authenticated`, so only
-- service_role (i.e. a server function) can raise or clear one.

CREATE TABLE public.password_reset_requirements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  required_at timestamptz NOT NULL DEFAULT now(),
  required_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz
);

-- Every guarded server call checks for a pending row, so keep that lookup cheap.
CREATE INDEX password_reset_requirements_pending_idx
  ON public.password_reset_requirements (user_id)
  WHERE completed_at IS NULL;

GRANT SELECT ON public.password_reset_requirements TO authenticated;
GRANT ALL ON public.password_reset_requirements TO service_role;

ALTER TABLE public.password_reset_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own reset requirement"
  ON public.password_reset_requirements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can see every reset requirement"
  ON public.password_reset_requirements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

-- Carry over anyone currently flagged. Compared as text rather than cast to
-- boolean: the old key was user-writable, so it may hold arbitrary JSON.
INSERT INTO public.password_reset_requirements (user_id, required_at)
SELECT u.id, now()
FROM auth.users u
WHERE u.raw_user_meta_data ->> 'password_reset_required' = 'true'
ON CONFLICT (user_id) DO NOTHING;

-- Drop the user-writable copy so nothing can read it as authoritative again.
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data
      - 'password_reset_required'
      - 'password_reset_requested_at'
      - 'password_reset_completed_at'
WHERE raw_user_meta_data ?| ARRAY[
  'password_reset_required',
  'password_reset_requested_at',
  'password_reset_completed_at'
];

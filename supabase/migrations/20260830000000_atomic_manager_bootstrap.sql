-- The first-manager bootstrap ran as a count-then-insert on the service-role
-- client. Two callers could both read an empty `user_roles` and both be granted
-- manager, and the client-side check was the only thing narrowing who could try.
--
-- Move the decision into the database, behind a transaction-scoped advisory
-- lock, so the second caller waits and then sees the row the first one wrote.
-- The function is SECURITY DEFINER and executable only by the service role, so
-- it is reachable solely through the server function that wraps it.

CREATE OR REPLACE FUNCTION public.claim_first_manager(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed boolean := false;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('public.claim_first_manager'));

  -- Bootstrap only on a genuinely empty roster. Once anyone holds any role,
  -- further access is granted by a manager through `setTeamRole`.
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'manager');
    v_claimed := true;
  END IF;

  RETURN v_claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_manager(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_first_manager(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.claim_first_manager(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_manager(uuid) TO service_role;

-- Keep request status updates and their timeline entries in one transaction.
CREATE OR REPLACE FUNCTION public.advance_request(
  p_request_id uuid,
  p_next_status text,
  p_author_staff_id uuid DEFAULT NULL,
  p_author_name text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_request public.requests%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF p_next_status NOT IN ('new', 'in_progress', 'done') THEN
    RAISE EXCEPTION 'Invalid request status';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['staff'::app_role, 'manager'::app_role, 'housekeeper'::app_role])
  ) THEN
    RAISE EXCEPTION 'Not authorized to update requests' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_request
  FROM public.requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_next_status = 'in_progress' THEN
    UPDATE public.requests
    SET
      status = p_next_status,
      started_at = COALESCE(v_request.started_at, v_now),
      started_by_staff_id = CASE
        WHEN v_request.started_at IS NULL THEN p_author_staff_id
        ELSE v_request.started_by_staff_id
      END,
      started_by_name = CASE
        WHEN v_request.started_at IS NULL THEN p_author_name
        ELSE v_request.started_by_name
      END,
      resolved_at = NULL,
      resolved_by_staff_id = NULL,
      resolved_by_name = NULL,
      response_seconds = NULL
    WHERE id = p_request_id;
  ELSIF p_next_status = 'done' THEN
    UPDATE public.requests
    SET
      status = p_next_status,
      resolved_at = v_now,
      resolved_by_staff_id = p_author_staff_id,
      resolved_by_name = p_author_name,
      response_seconds = GREATEST(0, ROUND(EXTRACT(EPOCH FROM v_now - v_request.created_at)))
    WHERE id = p_request_id;
  ELSE
    UPDATE public.requests
    SET
      status = p_next_status,
      started_at = NULL,
      started_by_staff_id = NULL,
      started_by_name = NULL,
      resolved_at = NULL,
      resolved_by_staff_id = NULL,
      resolved_by_name = NULL,
      response_seconds = NULL
    WHERE id = p_request_id;
  END IF;

  INSERT INTO public.request_notes (
    request_id,
    body,
    status_from,
    status_to,
    author_staff_id,
    author_name
  ) VALUES (
    p_request_id,
    NULLIF(BTRIM(COALESCE(p_note, '')), ''),
    v_request.status,
    p_next_status,
    p_author_staff_id,
    p_author_name
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_request(uuid, text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_request(uuid, text, uuid, text, text) TO authenticated, service_role;

-- Housekeepers can now add timeline rows through the same role set allowed to update requests.
DROP POLICY IF EXISTS "Staff and managers can add request notes" ON public.request_notes;
DROP POLICY IF EXISTS "Staff can add request notes" ON public.request_notes;
CREATE POLICY "Staff can add request notes" ON public.request_notes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role, 'housekeeper'::app_role])
  ));

-- Serialise each scope/identifier pair so a burst cannot overrun a volumetric limit.
CREATE OR REPLACE FUNCTION public.consume_guest_attempt(
  p_scope text,
  p_identifier text,
  p_max integer,
  p_window_minutes integer,
  p_failures_only boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifier text := LEFT(LOWER(BTRIM(COALESCE(p_identifier, ''))), 120);
  v_count integer;
  v_allowed boolean;
  v_since timestamptz;
BEGIN
  IF p_scope NOT IN ('guest_sign_in', 'guest_request', 'guest_message', 'guest_thread') THEN
    RAISE EXCEPTION 'Invalid guest attempt scope';
  END IF;

  IF p_max < 1 OR p_window_minutes < 1 THEN
    RAISE EXCEPTION 'Invalid guest attempt limit';
  END IF;

  IF v_identifier = '' THEN
    v_identifier := 'unknown';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_scope), hashtext(v_identifier));

  v_since := now() - make_interval(mins => p_window_minutes);

  SELECT COUNT(*)
  INTO v_count
  FROM public.guest_auth_attempts
  WHERE scope = p_scope
    AND identifier = v_identifier
    AND created_at >= v_since
    AND (NOT p_failures_only OR succeeded = false);

  v_allowed := v_count < p_max;

  -- Successful sign-ins are recorded after credential verification. Volumetric
  -- scopes reserve capacity here, only when the action is allowed.
  IF v_allowed AND NOT p_failures_only THEN
    INSERT INTO public.guest_auth_attempts (scope, identifier, succeeded)
    VALUES (p_scope, v_identifier, true);
  END IF;

  RETURN v_allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_guest_attempt(text, text, integer, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_guest_attempt(text, text, integer, integer, boolean) TO service_role;
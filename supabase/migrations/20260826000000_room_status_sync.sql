-- Atomic, idempotent room-status write for intermittent-connectivity workflows.
-- A local device operation is applied once, guarded against stale room versions,
-- and recorded in the status audit trail in the same database transaction.

ALTER TABLE public.room_status_events
  ADD COLUMN IF NOT EXISTS operation_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS room_status_events_operation_id_key
  ON public.room_status_events (operation_id)
  WHERE operation_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.apply_room_status_change(
  p_operation_id uuid,
  p_room_id uuid,
  p_expected_updated_at timestamptz,
  p_new_status room_status,
  p_staff_member_id uuid DEFAULT NULL,
  p_staff_name text DEFAULT NULL,
  p_changed_at timestamptz DEFAULT now()
)
RETURNS TABLE (
  outcome text,
  current_status room_status,
  current_updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_old_status room_status;
  v_existing_status room_status;
  v_existing_updated_at timestamptz;
  v_previous_changed_at timestamptz;
  v_duration_seconds integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['staff'::app_role, 'manager'::app_role, 'housekeeper'::app_role])
  ) THEN
    RAISE EXCEPTION 'Only operational staff can update room status';
  END IF;

  IF p_operation_id IS NULL OR p_room_id IS NULL OR p_expected_updated_at IS NULL THEN
    RAISE EXCEPTION 'A room-status operation, room, and reviewed version are required';
  END IF;

  -- Safe retry: if this same device operation already reached the database,
  -- acknowledge it without creating a second audit event.
  SELECT e.new_status, r.updated_at
  INTO v_existing_status, v_existing_updated_at
  FROM public.room_status_events e
  LEFT JOIN public.rooms r ON r.id = e.room_id
  WHERE e.operation_id = p_operation_id;

  IF FOUND THEN
    RETURN QUERY
    SELECT 'synced'::text, v_existing_status, v_existing_updated_at;
    RETURN;
  END IF;

  SELECT *
  INTO v_room
  FROM public.rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room % was not found', p_room_id;
  END IF;

  -- A mismatch means another device changed the room after this device displayed it.
  -- Preserve both states and make the conflict explicit rather than overwriting.
  IF v_room.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN QUERY
    SELECT 'conflict'::text, v_room.status, v_room.updated_at;
    RETURN;
  END IF;

  SELECT e.changed_at
  INTO v_previous_changed_at
  FROM public.room_status_events e
  WHERE e.room_id = p_room_id
  ORDER BY e.changed_at DESC
  LIMIT 1;

  IF v_previous_changed_at IS NULL THEN
    v_previous_changed_at := v_room.updated_at;
  END IF;

  v_duration_seconds := GREATEST(
    0,
    ROUND(EXTRACT(EPOCH FROM (p_changed_at - v_previous_changed_at)))::integer
  );

  v_old_status := v_room.status;

  UPDATE public.rooms
  SET status = p_new_status
  WHERE id = p_room_id
  RETURNING * INTO v_room;

  INSERT INTO public.room_status_events (
    operation_id,
    room_id,
    room_number,
    old_status,
    new_status,
    staff_member_id,
    staff_name,
    changed_by,
    previous_changed_at,
    duration_seconds,
    is_turnover,
    changed_at
  )
  VALUES (
    p_operation_id,
    v_room.id,
    v_room.number,
    v_old_status,
    p_new_status,
    p_staff_member_id,
    p_staff_name,
    auth.uid(),
    v_previous_changed_at,
    v_duration_seconds,
    v_old_status = 'vacant_dirty' AND p_new_status = 'vacant_clean',
    p_changed_at
  );

  RETURN QUERY
  SELECT 'synced'::text, v_room.status, v_room.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_room_status_change(uuid, uuid, timestamptz, room_status, uuid, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_room_status_change(uuid, uuid, timestamptz, room_status, uuid, text, timestamptz) TO authenticated;

-- Atomic, database-level audit trail for operational changes.
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_room text;
  v_detail jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
  ELSE
    v_action := 'updated';
  END IF;

  IF TG_TABLE_NAME = 'rooms' THEN
    v_room := COALESCE(NEW.number, OLD.number);
    IF TG_OP = 'UPDATE' THEN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        v_action := 'status_changed';
        v_detail := jsonb_build_object('from', OLD.status, 'to', NEW.status);
      ELSIF (NEW.door_pin IS DISTINCT FROM OLD.door_pin) THEN
        v_action := CASE WHEN NEW.door_pin IS NULL THEN 'key_cleared' ELSE 'key_issued' END;
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'requests' THEN
    v_room := COALESCE(NEW.room, OLD.room);
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'status_changed';
      v_detail := jsonb_build_object('from', OLD.status, 'to', NEW.status);
    END IF;
  ELSIF TG_TABLE_NAME = 'bookings' THEN
    v_room := COALESCE(NEW.room, OLD.room);
  END IF;

  INSERT INTO public.audit_events (entity, entity_id, action, actor_user_id, room, detail)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    v_action,
    auth.uid(),
    v_room,
    v_detail
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS rooms_audit ON public.rooms;
CREATE TRIGGER rooms_audit AFTER INSERT OR UPDATE OR DELETE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

DROP TRIGGER IF EXISTS requests_audit ON public.requests;
CREATE TRIGGER requests_audit AFTER INSERT OR UPDATE OR DELETE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

DROP TRIGGER IF EXISTS bookings_audit ON public.bookings;
CREATE TRIGGER bookings_audit AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

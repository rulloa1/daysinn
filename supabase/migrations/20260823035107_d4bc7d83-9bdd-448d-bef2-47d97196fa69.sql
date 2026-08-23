-- Restrict who can read staff records (PINs live here)
DROP POLICY IF EXISTS "Staff can view staff members" ON public.staff_members;
CREATE POLICY "Staff and managers can view staff members"
ON public.staff_members FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['staff'::app_role,'manager'::app_role])));

ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'front_desk';

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS dnd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS extended_stay boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_check_out date;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS original_check_out date;

UPDATE public.bookings SET original_check_out = check_out WHERE original_check_out IS NULL;
UPDATE public.rooms SET original_check_out = check_out WHERE original_check_out IS NULL AND check_out IS NOT NULL;
UPDATE public.rooms SET dnd = true WHERE status = 'occupied_dnd';

-- Keep the DND flag in sync with the DND status
CREATE OR REPLACE FUNCTION public.sync_room_dnd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'occupied_dnd' THEN
    NEW.dnd = true;
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND OLD.status = 'occupied_dnd' THEN
    NEW.dnd = false;
  END IF;

  IF NEW.check_out IS NOT NULL AND NEW.original_check_out IS NULL THEN
    NEW.original_check_out = NEW.check_out;
  END IF;

  NEW.extended_stay = (
    NEW.check_out IS NOT NULL
    AND NEW.original_check_out IS NOT NULL
    AND NEW.check_out > NEW.original_check_out
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rooms_sync_dnd ON public.rooms;
CREATE TRIGGER rooms_sync_dnd BEFORE INSERT OR UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.sync_room_dnd();

-- Extending a booking's checkout marks the stay (and the room) as extended
CREATE OR REPLACE FUNCTION public.sync_booking_extension()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.original_check_out IS NULL THEN
    NEW.original_check_out = NEW.check_out;
  END IF;

  UPDATE public.rooms r
  SET check_out = NEW.check_out,
      original_check_out = COALESCE(r.original_check_out, NEW.original_check_out)
  WHERE r.number = NEW.room
    AND NEW.check_out > NEW.original_check_out;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_sync_extension ON public.bookings;
CREATE TRIGGER bookings_sync_extension BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_extension();
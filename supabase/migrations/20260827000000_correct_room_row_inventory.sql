-- Correct the room rows from the property manager's verified numbering.
-- The ground-floor row starts at 109 and the upper row starts at 209.
INSERT INTO public.rooms (number, floor, bed_type, status)
VALUES
  ('109', 1, '1 King', 'vacant_clean'::room_status),
  ('209', 2, '1 King', 'vacant_clean'::room_status)
ON CONFLICT (number) DO UPDATE
SET floor = EXCLUDED.floor;

-- These room numbers are not present at the property and must not be surfaced
-- in operational views. Related status events cascade on delete; housekeeping
-- assignments retain their recorded room number and are set to NULL as defined
-- by their foreign key.
DELETE FROM public.rooms
WHERE number IN ('237', '239');

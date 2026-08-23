-- Sync the room inventory to the real Days Inn Wildwood property layout
WITH real_rooms AS (
  SELECT n::text AS number, 1 AS floor FROM generate_series(110, 163) n
  UNION ALL SELECT '108', 1
  UNION ALL SELECT n::text, 2 FROM generate_series(200, 263) n
  UNION ALL SELECT '265', 2
)
INSERT INTO public.rooms (number, floor, bed_type, status)
SELECT rr.number, rr.floor,
       CASE WHEN (rr.number::int) % 2 = 0 THEN '2 Queens' ELSE '1 King' END,
       'vacant_clean'::room_status
FROM real_rooms rr
WHERE NOT EXISTS (SELECT 1 FROM public.rooms r WHERE r.number = rr.number);

WITH real_rooms AS (
  SELECT n::text AS number FROM generate_series(110, 163) n
  UNION ALL SELECT '108'
  UNION ALL SELECT n::text FROM generate_series(200, 263) n
  UNION ALL SELECT '265'
)
UPDATE public.rooms r
SET floor = CASE WHEN (r.number::int) >= 200 THEN 2 ELSE 1 END
WHERE r.number IN (SELECT number FROM real_rooms);

-- Detach history from rooms that are not part of the real property
UPDATE public.room_status_events e
SET room_id = NULL
WHERE e.room_id IN (
  SELECT id FROM public.rooms r
  WHERE r.number NOT IN (
    SELECT n::text FROM generate_series(110, 163) n
    UNION ALL SELECT '108'
    UNION ALL SELECT n::text FROM generate_series(200, 263) n
    UNION ALL SELECT '265'
  )
);

DELETE FROM public.rooms r
WHERE r.number NOT IN (
  SELECT n::text FROM generate_series(110, 163) n
  UNION ALL SELECT '108'
  UNION ALL SELECT n::text FROM generate_series(200, 263) n
  UNION ALL SELECT '265'
);
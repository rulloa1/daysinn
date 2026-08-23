WITH base AS (
  SELECT unnest(ARRAY[101]
    || ARRAY(SELECT generate_series(127,147,2))
    || ARRAY(SELECT generate_series(128,144,2))
    || ARRAY(SELECT generate_series(103,121,2))
    || ARRAY(SELECT generate_series(152,166,2))) AS n
), target AS (
  SELECT (n)::text AS number, 1 AS floor FROM base
  UNION ALL
  SELECT (n+100)::text, 2 FROM base
)
INSERT INTO public.rooms (number, floor, bed_type, status)
SELECT t.number, t.floor, '2 Queen', 'vacant_clean'::room_status
FROM target t
WHERE NOT EXISTS (SELECT 1 FROM public.rooms r WHERE r.number = t.number);

WITH base AS (
  SELECT unnest(ARRAY[101]
    || ARRAY(SELECT generate_series(127,147,2))
    || ARRAY(SELECT generate_series(128,144,2))
    || ARRAY(SELECT generate_series(103,121,2))
    || ARRAY(SELECT generate_series(152,166,2))) AS n
), target AS (
  SELECT (n)::text AS number FROM base
  UNION ALL
  SELECT (n+100)::text FROM base
)
DELETE FROM public.rooms r
WHERE r.number NOT IN (SELECT number FROM target);
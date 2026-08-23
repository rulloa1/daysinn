CREATE TABLE public.room_rates (
  room_type text PRIMARY KEY,
  label text NOT NULL,
  beds text NOT NULL,
  max_occupancy int NOT NULL,
  nightly_rate numeric(10,2) NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.room_rates TO anon;
GRANT SELECT ON public.room_rates TO authenticated;
GRANT ALL ON public.room_rates TO service_role;

ALTER TABLE public.room_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room rates are publicly viewable"
  ON public.room_rates FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.room_rates (room_type, label, beds, max_occupancy, nightly_rate, sort_order) VALUES
  ('king', 'One King Bed', '1 king bed · 300 sq ft', 2, 89.00, 1),
  ('double_queen', 'Two Queen Beds', '2 queen beds · 330 sq ft', 4, 99.00, 2);

CREATE TRIGGER update_room_rates_updated_at
BEFORE UPDATE ON public.room_rates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.room_type_key(_bed_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN lower(coalesce(_bed_type, '')) LIKE '%king%' THEN 'king' ELSE 'double_queen' END
$$;

CREATE OR REPLACE FUNCTION public.check_availability(_check_in date, _check_out date, _guests int DEFAULT 1)
RETURNS TABLE (
  room_type text,
  label text,
  beds text,
  max_occupancy int,
  nightly_rate numeric,
  available_count int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.room_type,
         r.label,
         r.beds,
         r.max_occupancy,
         r.nightly_rate,
         COALESCE(a.available_count, 0)::int
  FROM public.room_rates r
  LEFT JOIN (
    SELECT public.room_type_key(rm.bed_type) AS room_type, count(*)::int AS available_count
    FROM public.rooms rm
    WHERE rm.status::text <> 'out_of_order'
      AND NOT EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.room = rm.number
          AND b.check_in < _check_out
          AND b.check_out > _check_in
      )
    GROUP BY 1
  ) a ON a.room_type = r.room_type
  WHERE _check_out > _check_in
    AND r.max_occupancy >= GREATEST(COALESCE(_guests, 1), 1)
  ORDER BY r.sort_order
$$;

REVOKE ALL ON FUNCTION public.check_availability(date, date, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_availability(date, date, int) TO anon, authenticated, service_role;
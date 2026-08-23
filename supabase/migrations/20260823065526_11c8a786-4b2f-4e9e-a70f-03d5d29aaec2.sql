CREATE OR REPLACE FUNCTION public.mask_guest_name(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN name IS NULL OR btrim(name) = '' THEN NULL
    ELSE upper(substr(btrim(name), 1, 1)) || '. ' || repeat('•', 3)
  END
$$;
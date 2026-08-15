ALTER TABLE public.requests
  ADD CONSTRAINT requests_room_not_empty
  CHECK (length(btrim(room)) BETWEEN 1 AND 10);
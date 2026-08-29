ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guests integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS room_type text;
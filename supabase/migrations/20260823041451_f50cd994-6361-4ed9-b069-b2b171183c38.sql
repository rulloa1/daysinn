ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_name text,
  ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS rooms_assigned_staff_id_idx ON public.rooms(assigned_staff_id);
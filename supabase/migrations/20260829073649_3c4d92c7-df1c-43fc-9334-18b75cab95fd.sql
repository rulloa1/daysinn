UPDATE public.staff_members SET pin = NULL WHERE pin IS NOT NULL;
ALTER TABLE public.staff_members DROP COLUMN IF EXISTS pin;
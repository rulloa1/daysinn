ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS sms_phone text,
  ADD COLUMN IF NOT EXISTS sms_alerts boolean NOT NULL DEFAULT false;
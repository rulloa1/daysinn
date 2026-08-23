-- 1. Room model extensions -------------------------------------------------
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS wing text,
  ADD COLUMN IF NOT EXISTS side text,
  ADD COLUMN IF NOT EXISTS guest_status text,
  ADD COLUMN IF NOT EXISTS hk_stage text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS linen_change boolean NOT NULL DEFAULT false;

-- Derive wing / side from the physical layout (front block north rows,
-- front block south rows, rear block).
UPDATE public.rooms SET
  wing = CASE
    WHEN (number::int % 100) BETWEEN 136 AND 163 THEN 'South Wing'
    WHEN (number::int % 100) BETWEEN 118 AND 135 THEN 'West Wing'
    ELSE 'North Wing'
  END,
  side = CASE
    WHEN (number::int % 100) BETWEEN 136 AND 163 THEN
      CASE WHEN (number::int) % 2 = 0 THEN 'Pool side' ELSE 'Rear side' END
    ELSE
      CASE WHEN (number::int) % 2 = 0 THEN 'Courtyard side' ELSE 'Parking side' END
  END
WHERE wing IS NULL AND number ~ '^[0-9]+$';

UPDATE public.rooms SET guest_status = CASE
  WHEN status = 'out_of_order' THEN 'Out of Order'
  WHEN status = 'reserved' THEN 'Expected Arrival'
  WHEN extended_stay THEN 'Stayover'
  WHEN status IN ('occupied', 'occupied_dnd') AND check_out = CURRENT_DATE THEN 'Checkout'
  WHEN status IN ('occupied', 'occupied_dnd') THEN 'Occupied'
  ELSE 'Vacant'
END
WHERE guest_status IS NULL;

ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_priority_check CHECK (priority IN ('Normal', 'High', 'VIP')),
  ADD CONSTRAINT rooms_hk_stage_check CHECK (hk_stage IS NULL OR hk_stage IN ('in_progress', 'inspected')),
  ADD CONSTRAINT rooms_guest_status_check CHECK (
    guest_status IS NULL OR guest_status IN
      ('Vacant', 'Occupied', 'Checkout', 'Stayover', 'Expected Arrival', 'Out of Order')
  );

-- 2. Maintenance tickets -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  description text NOT NULL,
  urgency text NOT NULL DEFAULT 'Normal' CHECK (urgency IN ('Low', 'Normal', 'High', 'Urgent')),
  reporter text,
  reporter_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_tickets TO authenticated;
GRANT ALL ON public.maintenance_tickets TO service_role;

ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in staff can view maintenance tickets"
ON public.maintenance_tickets FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role, 'viewer'::app_role, 'housekeeper'::app_role])
));

CREATE POLICY "Working staff can open maintenance tickets"
ON public.maintenance_tickets FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role, 'housekeeper'::app_role])
));

CREATE POLICY "Working staff can update maintenance tickets"
ON public.maintenance_tickets FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role, 'housekeeper'::app_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['staff'::app_role, 'manager'::app_role, 'housekeeper'::app_role])
));

CREATE POLICY "Managers can delete maintenance tickets"
ON public.maintenance_tickets FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'manager'::app_role
));

CREATE TRIGGER maintenance_tickets_set_updated_at
BEFORE UPDATE ON public.maintenance_tickets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS maintenance_tickets_status_idx
  ON public.maintenance_tickets (status, created_at DESC);
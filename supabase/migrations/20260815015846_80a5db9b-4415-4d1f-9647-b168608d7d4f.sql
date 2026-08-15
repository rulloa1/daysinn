CREATE TYPE public.room_status AS ENUM ('occupied','vacant_clean','vacant_dirty','out_of_order');

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  floor int NOT NULL DEFAULT 1,
  bed_type text NOT NULL DEFAULT 'Queen',
  status public.room_status NOT NULL DEFAULT 'vacant_clean',
  guest_name text,
  check_in date,
  check_out date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff and managers can update rooms" ON public.rooms FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'staff'::app_role) OR has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'staff'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE POLICY "Managers can insert rooms" ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'manager'::app_role));
CREATE POLICY "Managers can delete rooms" ON public.rooms FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'manager'::app_role));

CREATE TRIGGER rooms_set_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

INSERT INTO public.rooms (number, floor, bed_type, status, guest_name, check_in, check_out, notes) VALUES
('101',1,'Queen','occupied','M. Alvarez', CURRENT_DATE - 2, CURRENT_DATE, NULL),
('102',1,'Queen','occupied','R. Ulloa', CURRENT_DATE - 1, CURRENT_DATE + 2, NULL),
('103',1,'Double','vacant_dirty',NULL,NULL,NULL,'Late checkout, needs turn'),
('104',1,'Queen','vacant_clean',NULL,NULL,CURRENT_DATE,NULL),
('105',1,'King','occupied','J. Whitfield', CURRENT_DATE - 3, CURRENT_DATE, NULL),
('106',1,'Queen','out_of_order',NULL,NULL,NULL,'AC compressor on order'),
('107',1,'Double','vacant_clean',NULL,CURRENT_DATE,NULL,'Arrival 3pm — T. Nguyen'),
('108',1,'Queen','vacant_dirty',NULL,NULL,NULL,NULL),
('201',2,'King','occupied','D. Okafor', CURRENT_DATE - 1, CURRENT_DATE + 1, NULL),
('202',2,'Queen','vacant_clean',NULL,CURRENT_DATE,NULL,'Arrival — L. Brennan'),
('203',2,'Queen','occupied','S. Patel', CURRENT_DATE - 4, CURRENT_DATE + 3, 'Extra pillows'),
('204',2,'Double','vacant_clean',NULL,NULL,NULL,NULL),
('205',2,'Queen','vacant_dirty',NULL,NULL,CURRENT_DATE,NULL),
('206',2,'King','occupied','A. Ferraro', CURRENT_DATE, CURRENT_DATE + 2, NULL),
('207',2,'Queen','vacant_clean',NULL,NULL,NULL,NULL),
('208',2,'Double','occupied','K. Mendes', CURRENT_DATE - 2, CURRENT_DATE, NULL),
('301',3,'King','vacant_clean',NULL,CURRENT_DATE,NULL,'Arrival — C. Ito'),
('302',3,'Queen','occupied','B. Larkin', CURRENT_DATE - 1, CURRENT_DATE + 4, NULL),
('303',3,'Queen','vacant_dirty',NULL,NULL,NULL,NULL),
('304',3,'Double','vacant_clean',NULL,NULL,NULL,NULL),
('305',3,'Queen','out_of_order',NULL,NULL,NULL,'Bathroom tile repair'),
('306',3,'King','occupied','P. Sandoval', CURRENT_DATE - 5, CURRENT_DATE + 1, NULL),
('307',3,'Queen','occupied','H. Kim', CURRENT_DATE - 1, CURRENT_DATE, 'Room refresh after 2pm'),
('308',3,'Double','vacant_clean',NULL,NULL,NULL,NULL);
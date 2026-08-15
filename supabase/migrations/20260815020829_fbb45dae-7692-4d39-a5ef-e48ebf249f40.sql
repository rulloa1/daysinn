DROP POLICY IF EXISTS "Managers can delete requests" ON public.requests;
DROP POLICY IF EXISTS "Staff and managers can update requests" ON public.requests;
DROP POLICY IF EXISTS "Managers can delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "Managers can insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "Staff and managers can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Managers can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can view all roles" ON public.user_roles;

CREATE POLICY "Staff and managers can update requests"
ON public.requests FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager')));

CREATE POLICY "Managers can delete requests"
ON public.requests FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager'));

CREATE POLICY "Staff and managers can update rooms"
ON public.rooms FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','manager')));

CREATE POLICY "Managers can insert rooms"
ON public.rooms FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager'));

CREATE POLICY "Managers can delete rooms"
ON public.rooms FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager'));

DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.claim_first_manager();
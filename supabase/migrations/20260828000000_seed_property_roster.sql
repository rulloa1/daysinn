-- Root cause of the empty housekeeping dropdown and the 403 on "add to roster":
-- the signed-in property account held no row in user_roles. Every staff_members
-- RLS policy requires staff/manager/housekeeper, so SELECT returned zero rows
-- (indistinguishable from an empty table) and INSERT failed the WITH CHECK.
insert into public.user_roles (user_id, role)
select u.id, 'manager'::app_role
from auth.users u
where u.email = 'roryulloa@gmail.com'
on conflict (user_id, role) do nothing;

-- Retire the Alice/Bob/Carol demo rows. Deactivated rather than deleted so the
-- change is one UPDATE to reverse; no FK rows referenced them.
update public.staff_members
set active = false
where name in ('Alice (Manager)', 'Bob (Front Desk)', 'Carol (Housekeeping)');

-- The real roster. Guarded on name so re-running the migration is a no-op.
insert into public.staff_members (name, department, active, is_supervisor)
select v.name, v.department, true, v.is_supervisor
from (values
  ('Tyrell',         'management',   true),
  ('David',          'management',   true),
  ('Maria Delgado',  'housekeeping', false),
  ('Rosa Ortiz',     'housekeeping', false),
  ('Yolanda Pierce', 'housekeeping', false),
  ('Aisha Bennett',  'housekeeping', false),
  ('Lucia Ferrara',  'housekeeping', false),
  ('Grace Mbeki',    'housekeeping', false)
) as v(name, department, is_supervisor)
where not exists (
  select 1 from public.staff_members s where s.name = v.name
);

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  staff_id uuid references public.staff_members(id) on delete set null,
  staff_name text,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;

alter table public.push_subscriptions enable row level security;

drop policy if exists "staff manage own push subscriptions" on public.push_subscriptions;
create policy "staff manage own push subscriptions"
on public.push_subscriptions for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.notify_housekeeping_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  kind text;
begin
  if new.dnd is distinct from old.dnd and new.dnd then
    kind := 'dnd';
  elsif new.extended_stay is distinct from old.extended_stay and new.extended_stay then
    kind := 'stayover';
  elsif new.extended_stay and old.extended_stay
        and new.check_out is distinct from old.check_out then
    kind := 'stayover_updated';
  else
    return new;
  end if;

  perform net.http_post(
    url := 'https://daysinn.lovable.app/api/public/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', 'REDACTED_ROTATED_SECRET'
    ),
    body := jsonb_build_object(
      'kind', kind,
      'room', new.number,
      'check_out', new.check_out
    )
  );
  return new;
end;
$$;

drop trigger if exists rooms_housekeeping_push on public.rooms;
create trigger rooms_housekeeping_push
after update on public.rooms
for each row execute function public.notify_housekeeping_push();
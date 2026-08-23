-- Move the push-dispatch shared secret out of function source into a
-- private table that only SECURITY DEFINER functions can read.
CREATE TABLE IF NOT EXISTS public.internal_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.internal_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.internal_secrets TO service_role;
ALTER TABLE public.internal_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.internal_secrets (name, value)
VALUES ('push_dispatch_secret', '1c05728ecdd7893b7d99a0a9873d8c4343f7745db0d0da0f8e47cbdb0fa391d3')
ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE FUNCTION public.notify_housekeeping_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
declare
  kind text;
  push_secret text;
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

  select value into push_secret
  from public.internal_secrets
  where name = 'push_dispatch_secret';

  if push_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://daysinn.lovable.app/api/public/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', push_secret
    ),
    body := jsonb_build_object(
      'kind', kind,
      'room', new.number,
      'check_out', new.check_out
    )
  );
  return new;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_housekeeping_push() FROM PUBLIC, anon, authenticated;

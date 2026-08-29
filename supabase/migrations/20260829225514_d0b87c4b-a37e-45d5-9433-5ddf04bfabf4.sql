ALTER FUNCTION public.rooms_board() SECURITY INVOKER;
ALTER FUNCTION public.requests_board() SECURITY INVOKER;

REVOKE ALL ON FUNCTION public.check_availability(date, date, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_availability(date, date, integer) TO service_role;
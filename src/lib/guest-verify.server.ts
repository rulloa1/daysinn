/** Server-only guest identity check: room number + guest last name. */
export type VerifiedGuest = {
  room: string;
  guestName: string;
  checkOut: string | null;
  doorPin: string | null;
  doorPinSetAt: string | null;
};

function lastNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

export async function verifyGuest(
  room: string,
  lastName: string,
): Promise<VerifiedGuest | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("rooms")
    .select("number, guest_name, check_out, door_pin, door_pin_set_at")
    .eq("number", room)
    .maybeSingle();

  if (!data?.guest_name) return null;
  if (lastNameOf(data.guest_name) !== lastName.trim().toLowerCase()) return null;

  return {
    room: data.number,
    guestName: data.guest_name,
    checkOut: data.check_out,
    doorPin: data.door_pin,
    doorPinSetAt: data.door_pin_set_at,
  };
}

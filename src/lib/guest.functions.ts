import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentialsSchema = z.object({
  room: z.string().trim().min(1).max(10),
  lastName: z.string().trim().min(1).max(80),
});

type Credentials = z.infer<typeof credentialsSchema>;

function lastNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

async function verify({ room, lastName }: Credentials) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("rooms")
    .select("number, guest_name, check_out")
    .eq("number", room)
    .maybeSingle();

  if (!data?.guest_name) return null;
  if (lastNameOf(data.guest_name) !== lastName.trim().toLowerCase()) return null;

  return {
    room: data.number,
    guestName: data.guest_name,
    checkOut: data.check_out,
  };
}

export const guestSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const guest = await verify(data);
    if (!guest) {
      return { ok: false as const, error: "We couldn't match that room and last name." };
    }
    return { ok: true as const, guest };
  });

export const guestRequests = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const guest = await verify(data);
    if (!guest) return { ok: false as const, requests: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("requests")
      .select("id, type, details, status, created_at")
      .eq("room", guest.room)
      .order("created_at", { ascending: false })
      .limit(30);

    return { ok: true as const, requests: rows ?? [] };
  });

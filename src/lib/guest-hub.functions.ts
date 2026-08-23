import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "@/lib/roles.guard";
import { verifyGuest } from "@/lib/guest-verify.server";

const credentials = z.object({
  room: z.string().trim().min(1).max(10),
  lastName: z.string().trim().min(1).max(80),
});

const sendSchema = credentials.extend({
  body: z.string().trim().min(1, "Type a message first.").max(1000),
});

/** Guest-side chat thread + digital room key, gated on room + last name. */
export const guestThread = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentials.parse(input))
  .handler(async ({ data }) => {
    const guest = await verifyGuest(data.room, data.lastName);
    if (!guest) return { ok: false as const, messages: [], key: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("guest_messages")
      .select("id, body, sender, author_name, created_at")
      .eq("room", guest.room)
      .order("created_at", { ascending: true })
      .limit(100);

    await supabaseAdmin
      .from("guest_messages")
      .update({ read_by_guest: true })
      .eq("room", guest.room)
      .eq("sender", "staff")
      .eq("read_by_guest", false);

    return {
      ok: true as const,
      messages: rows ?? [],
      key: {
        pin: guest.doorPin,
        issuedAt: guest.doorPinSetAt,
        checkOut: guest.checkOut,
        guestName: guest.guestName,
      },
    };
  });

/** Guest sends a message to the front desk. */
export const guestSendMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    const guest = await verifyGuest(data.room, data.lastName);
    if (!guest) return { ok: false as const, error: "We couldn't verify your room." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("guest_messages").insert({
      room: guest.room,
      body: data.body,
      sender: "guest",
      author_name: guest.guestName,
    });
    if (error) return { ok: false as const, error: "Message didn't send." };
    return { ok: true as const };
  });

/** Staff-only: mint or rotate the digital room key PIN for a room. */
export const issueDoorPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ room: z.string().trim().min(1).max(10) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);

    const pin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
    const issuedAt = new Date().toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("rooms")
      .update({ door_pin: pin, door_pin_set_at: issuedAt })
      .eq("number", data.room);

    if (error) throw new Error("Could not issue a room key.");
    return { pin, issuedAt };
  });

/** Staff-only: clear a room key (checkout, lost phone, re-key). */
export const clearDoorPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ room: z.string().trim().min(1).max(10) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("rooms")
      .update({ door_pin: null, door_pin_set_at: null })
      .eq("number", data.room);
    return { ok: true as const };
  });

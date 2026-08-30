import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertStaff } from "@/lib/roles.guard";
import { verifyGuest } from "@/lib/guest-verify.server";
import { isPastCheckout } from "@/lib/guest-access";

const credentials = z.object({
  room: z.string().trim().min(1).max(10),
  lastName: z.string().trim().min(1).max(80),
});

const sendSchema = credentials.extend({
  body: z.string().trim().min(1, "Type a message first.").max(1000),
});

/** Guest-side chat thread + digital room key, gated on room + last name. */
export const guestThread = createServerFn({ method: "POST" })
  .validator((input: unknown) => credentials.parse(input))
  .handler(async ({ data }) => {
    const { allowGuestAttempt, recordAudit } = await import("@/lib/audit.server");
    if (!(await allowGuestAttempt("guest_thread", data.room))) {
      return { ok: false as const, dnd: false, messages: [], key: null };
    }

    const guest = await verifyGuest(data.room, data.lastName);
    if (!guest || isPastCheckout(guest.checkOut)) {
      return { ok: false as const, dnd: false, messages: [], key: null };
    }

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

    if (guest.doorPin) {
      await recordAudit({
        entity: "door_key",
        action: "viewed_by_guest",
        room: guest.room,
      });
    }

    return {
      ok: true as const,
      messages: rows ?? [],
      dnd: guest.dnd,
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
  .validator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    const { allowGuestAttempt } = await import("@/lib/audit.server");
    if (!(await allowGuestAttempt("guest_message", data.room))) {
      return { ok: false as const, error: "Too many messages just now — please wait a moment." };
    }

    const guest = await verifyGuest(data.room, data.lastName);
    if (!guest || isPastCheckout(guest.checkOut)) {
      return { ok: false as const, error: "We couldn't verify your room." };
    }

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
  .validator((input: unknown) => z.object({ room: z.string().trim().min(1).max(10) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);

    const pin = String((crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) % 1000000).padStart(
      6,
      "0",
    );
    const issuedAt = new Date().toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("rooms")
      .update({ door_pin: pin, door_pin_set_at: issuedAt })
      .eq("number", data.room);

    if (error) throw new Error("Could not issue a room key.");

    const { recordAudit } = await import("@/lib/audit.server");
    await recordAudit({
      entity: "door_key",
      action: "issued",
      actorUserId: context.userId,
      room: data.room,
      detail: { issuedAt },
    });

    return { pin, issuedAt };
  });

/** Staff-only: clear a room key (checkout, lost phone, re-key). */
export const clearDoorPin = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ room: z.string().trim().min(1).max(10) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("rooms")
      .update({ door_pin: null, door_pin_set_at: null })
      .eq("number", data.room);

    const { recordAudit } = await import("@/lib/audit.server");
    await recordAudit({
      entity: "door_key",
      action: "cleared",
      actorUserId: context.userId,
      room: data.room,
    });

    return { ok: true as const };
  });

/** Staff-only read of a room's current key, kept out of client table reads. */
export const readDoorPin = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ room: z.string().trim().min(1).max(10) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("rooms")
      .select("door_pin, door_pin_set_at")
      .eq("number", data.room)
      .maybeSingle();

    const { recordAudit } = await import("@/lib/audit.server");
    await recordAudit({
      entity: "door_key",
      action: "viewed_by_staff",
      actorUserId: context.userId,
      room: data.room,
    });

    return { pin: row?.door_pin ?? null, issuedAt: row?.door_pin_set_at ?? null };
  });

/** Guest raises or clears their own Do Not Disturb sign from the in-room portal. */
export const setGuestDnd = createServerFn({ method: "POST" })
  .validator((input: unknown) => credentials.extend({ dnd: z.boolean() }).parse(input))
  .handler(async ({ data }) => {
    const guest = await verifyGuest(data.room, data.lastName);
    if (!guest || isPastCheckout(guest.checkOut)) {
      return { ok: false as const, dnd: false, error: "We couldn't verify your room." };
    }

    // Keep the board status in step so the live map, front desk and
    // housekeeping all read the same signal.
    const patch: { dnd: boolean; status?: "occupied_dnd" | "occupied" } = { dnd: data.dnd };
    if (data.dnd) patch.status = "occupied_dnd";
    else if (guest.status === "occupied_dnd") patch.status = "occupied";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("rooms").update(patch).eq("number", guest.room);


    if (error) return { ok: false as const, dnd: guest.dnd, error: "Could not update the sign." };

    const { recordAudit } = await import("@/lib/audit.server");
    await recordAudit({
      entity: "rooms",
      action: data.dnd ? "guest_dnd_on" : "guest_dnd_off",
      room: guest.room,
    });

    return { ok: true as const, dnd: data.dnd };
  });

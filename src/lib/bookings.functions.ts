import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface UpdateBookingInput {
  id: string;
  room: string;
  room_type: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  guest_email: string | null;
  notify: boolean;
}

export type UpdateBookingResult =
  | { ok: false; reason: "authentication_required" | "forbidden" | "not_found" | "invalid" }
  | { ok: true; notified: boolean; note?: string };

export const updateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UpdateBookingInput) => input)
  .handler(async ({ data, context }): Promise<UpdateBookingResult> => {
    const { supabase, userId } = context;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = (roles ?? []).some((r) => r.role === "manager" || r.role === "staff");
    if (!allowed) return { ok: false, reason: "forbidden" };

    if (!data.room.trim() || data.check_out < data.check_in || data.guests < 1) {
      return { ok: false, reason: "invalid" };
    }

    const { data: before, error: readError } = await supabase
      .from("bookings")
      .select("id, guest_name, room, room_type, check_in, check_out, guests, guest_email")
      .eq("id", data.id)
      .maybeSingle();
    if (readError || !before) return { ok: false, reason: "not_found" };

    const patch = {
      room: data.room.trim(),
      room_type: data.room_type?.trim() || null,
      check_in: data.check_in,
      check_out: data.check_out,
      guests: data.guests,
      guest_email: data.guest_email?.trim() || null,
    };

    const { error: writeError } = await supabase
      .from("bookings")
      .update(patch)
      .eq("id", data.id);
    if (writeError) return { ok: false, reason: "invalid" };

    const { diffBooking, formatStayDate } = await import("./booking-changes");
    const changes = diffBooking(before, patch);

    const recipient = patch.guest_email;
    if (!data.notify || changes.length === 0 || !recipient) {
      return {
        ok: true,
        notified: false,
        ...(changes.length === 0
          ? { note: "no_changes" }
          : !recipient
            ? { note: "no_email" }
            : {}),
      };
    }

    try {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      const result = await sendTemplateEmail("booking-update", recipient, {
        templateData: {
          guestName: before.guest_name,
          confirmationCode: data.id.slice(0, 8).toUpperCase(),
          changes,
          checkIn: formatStayDate(patch.check_in),
          checkOut: formatStayDate(patch.check_out),
          roomType: patch.room_type ?? `Room ${patch.room}`,
          guests: patch.guests,
        },
        idempotencyKey: `booking-update-${data.id}-${patch.check_in}-${patch.check_out}-${patch.guests}-${patch.room}`,
      });
      if (!result.sent) return { ok: true, notified: false, note: "recipient_suppressed" };
      return { ok: true, notified: true };
    } catch (error) {
      console.error("booking update email failed", error);
      return { ok: true, notified: false, note: "email_failed" };
    }
  });

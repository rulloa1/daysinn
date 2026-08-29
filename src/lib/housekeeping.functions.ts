import { createServerFn } from "@tanstack/react-start";

import { assertHousekeeperOrStaff, assertManager } from "./roles.guard";

/**
 * Staff PINs live in `staff_members.pin`, and a migration revokes
 * `SELECT (pin)` / `UPDATE (pin)` from `authenticated` — only the service role
 * may touch that column. Every function here therefore checks the caller's role
 * against the request-scoped client and then does the privileged read or write
 * through `supabaseAdmin`.
 */

/** Four digits, and not one of the sequences everyone reaches for first. */
const WEAK_PINS = new Set([
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "2345",
  "3456",
  "4567",
  "5678",
  "6789",
  "0123",
  "9876",
  "4321",
]);

export function validatePin(pin: string): { ok: true } | { ok: false; reason: string } {
  if (!/^\d{4}$/.test(pin)) return { ok: false, reason: "A PIN is exactly four digits." };
  if (WEAK_PINS.has(pin)) {
    return { ok: false, reason: "That PIN is too easy to guess. Choose four other digits." };
  }
  return { ok: true };
}

/**
 * PIN check runs server-side so the PIN itself never reaches the browser.
 * Callers must already be signed in with a staff account.
 */
export const verifyStaffPin = createServerFn({ method: "POST" })
  .validator((input: { memberId: string; pin: string }) => input)
  .handler(async ({ data, context }) => {
    await assertHousekeeperOrStaff(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("staff_members")
      .select("id, name, pin, active, is_supervisor, user_id")
      .eq("id", data.memberId)
      .maybeSingle();

    if (error || !row || !row.active) {
      return { ok: false as const, reason: "not_found" as const };
    }
    const success = {
      ok: true as const,
      id: row.id,
      name: row.name,
      supervisor: row.is_supervisor,
    };

    // Link this roster record to the signed-in account so row-level rules can
    // tell which rooms belong to this housekeeper.
    async function linkAccount() {
      if (row!.user_id) return;
      await supabaseAdmin
        .from("staff_members")
        .update({ user_id: context.userId })
        .eq("id", row!.id)
        .is("user_id", null);
    }

    // No PIN set yet: name-only sign in is allowed, so a new property can start
    // working before a manager has sat down with everyone.
    if (!row.pin) {
      await linkAccount();
      return success;
    }
    if (row.pin !== data.pin.trim()) {
      return { ok: false as const, reason: "bad_pin" as const };
    }
    await linkAccount();
    return success;
  });

/** Store or clear a housekeeper's PIN. Managers only. */
export const setStaffPin = createServerFn({ method: "POST" })
  .validator((input: { memberId: string; pin: string }) => {
    if (typeof input?.memberId !== "string" || !input.memberId) {
      throw new Error("A staff member is required");
    }
    return { memberId: input.memberId, pin: typeof input.pin === "string" ? input.pin.trim() : "" };
  })
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId);

    // An empty string clears the PIN and returns the person to name-only sign-on.
    if (data.pin) {
      const check = validatePin(data.pin);
      if (!check.ok) return { ok: false as const, error: check.reason };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("staff_members")
      .update({ pin: data.pin ? data.pin : null })
      .eq("id", data.memberId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/**
 * Who currently has a PIN. Returns a boolean per person and never the PIN
 * itself, so the manager screen can show what still needs setting up.
 */
export const listStaffPinStatus = createServerFn({ method: "POST" }).handler(
  async ({ context }) => {
    await assertManager(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("staff_members")
      .select("id, name, department, active, pin")
      .order("name");
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      department: row.department,
      active: row.active,
      hasPin: Boolean(row.pin),
    }));
  },
);

/** Server-only audit trail + guest abuse throttling helpers. */

export type AuditEvent = {
  entity: string;
  entityId?: string | null;
  action: string;
  actorUserId?: string | null;
  actorName?: string | null;
  room?: string | null;
  detail?: Record<string, unknown>;
};

/** Best-effort: auditing must never block the operation it records. */
export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_events").insert({
      entity: event.entity,
      entity_id: event.entityId ?? null,
      action: event.action,
      actor_user_id: event.actorUserId ?? null,
      actor_name: event.actorName ?? null,
      room: event.room ?? null,
      detail: (event.detail ?? {}) as never,
    });
  } catch (error) {
    console.error("[audit] failed to record event", event.entity, event.action, error);
  }
}

export type ThrottleScope =
  | "guest_sign_in"
  | "guest_request"
  | "guest_message"
  | "guest_thread";

const LIMITS: Record<ThrottleScope, { max: number; windowMinutes: number }> = {
  guest_sign_in: { max: 8, windowMinutes: 15 },
  guest_request: { max: 12, windowMinutes: 10 },
  guest_message: { max: 30, windowMinutes: 10 },
  guest_thread: { max: 120, windowMinutes: 10 },
};

/** Records the outcome of a guest attempt (used for brute-force throttling). */
export async function recordGuestAttempt(
  scope: ThrottleScope,
  identifier: string,
  succeeded: boolean,
): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("guest_auth_attempts")
      .insert({ scope, identifier: keyOf(identifier), succeeded });
  } catch (error) {
    console.error("[throttle] record failed", scope, error);
  }
}

function keyOf(identifier: string): string {
  return identifier.trim().toLowerCase().slice(0, 120) || "unknown";
}

/**
 * Returns false when the caller has burned the window budget.
 *
 * Sign-in is throttled on *failed* attempts only, so a guest legitimately
 * re-scanning their code is never locked out; volumetric scopes (requests,
 * messages, thread polling) count every attempt.
 */
export async function allowGuestAttempt(
  scope: ThrottleScope,
  identifier: string,
): Promise<boolean> {
  const { max, windowMinutes } = LIMITS[scope];
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const failuresOnly = scope === "guest_sign_in";

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("guest_auth_attempts")
      .select("id", { count: "exact", head: true })
      .eq("scope", scope)
      .eq("identifier", keyOf(identifier))
      .gte("created_at", since);

    if (failuresOnly) query = query.eq("succeeded", false);

    const { count } = await query;

    if (!failuresOnly) {
      await supabaseAdmin
        .from("guest_auth_attempts")
        .insert({ scope, identifier: keyOf(identifier), succeeded: true });
    }

    return (count ?? 0) < max;
  } catch (error) {
    // Fail open rather than locking real guests out of the hub.
    console.error("[throttle] check failed", scope, error);
    return true;
  }
}


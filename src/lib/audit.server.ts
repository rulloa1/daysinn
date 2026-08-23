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

/**
 * Counts recent attempts for a scope+identifier and records this one.
 * Returns false when the caller has exceeded the window budget.
 */
export async function allowGuestAttempt(
  scope: ThrottleScope,
  identifier: string,
  succeeded = false,
): Promise<boolean> {
  const { max, windowMinutes } = LIMITS[scope];
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const key = identifier.trim().toLowerCase().slice(0, 120) || "unknown";

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("guest_auth_attempts")
      .select("id", { count: "exact", head: true })
      .eq("scope", scope)
      .eq("identifier", key)
      .gte("created_at", since);

    await supabaseAdmin
      .from("guest_auth_attempts")
      .insert({ scope, identifier: key, succeeded });

    return (count ?? 0) < max;
  } catch (error) {
    // Fail open rather than locking real guests out of the hub.
    console.error("[throttle] check failed", scope, error);
    return true;
  }
}

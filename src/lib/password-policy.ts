/**
 * Forced staff password resets.
 *
 * The dangerous part of this flow is *completion*, so the rule lives here as a
 * dependency-injected function rather than inside the server-function wrapper:
 * the requirement can only ever be cleared after the auth service has confirmed
 * a real password change. There is deliberately no other code path that clears
 * it, and the requirement itself is stored in a table the account cannot write
 * (see supabase/migrations/20260829000000_password_reset_enforcement.sql).
 */

export const MIN_PASSWORD_LENGTH = 12;

/** Thrown by the role guards while an account still owes a password reset. */
export class PasswordResetRequiredError extends Error {
  constructor(message = "Password reset required") {
    super(message);
    this.name = "PasswordResetRequiredError";
  }
}

export type PasswordChangeResult = { ok: true } | { ok: false; message: string };

export type CompletePasswordResetDeps = {
  /**
   * Changes the caller's password via the auth service, as the caller. Must
   * return `ok: false` for anything the auth service refused (too short, found
   * in a breach corpus, expired session, ...).
   */
  changePassword: (password: string) => Promise<PasswordChangeResult>;
  /** Clears the pending requirement. Service-role only; unreachable by the account. */
  clearRequirement: () => Promise<void>;
  recordAudit: () => Promise<void>;
};

/**
 * Completes a forced reset.
 *
 * Order matters and is load-bearing: `clearRequirement` runs only after
 * `changePassword` has resolved successfully. Any refusal propagates and leaves
 * the requirement standing, so the account stays gated.
 */
export async function completeForcedPasswordReset(
  password: string,
  deps: CompletePasswordResetDeps,
): Promise<{ ok: true }> {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const result = await deps.changePassword(password);
  if (!result.ok) {
    throw new Error(result.message);
  }

  await deps.clearRequirement();
  await deps.recordAudit();

  return { ok: true };
}

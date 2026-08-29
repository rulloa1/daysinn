import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  completeForcedPasswordReset,
  MIN_PASSWORD_LENGTH,
  type PasswordChangeResult,
} from "./password-policy";

/**
 * Regression cover for the forced-reset bypass.
 *
 * The original `completePasswordReset` cleared `user_metadata.password_reset_required`
 * on nothing more than "is authenticated", so a flagged account could call it
 * directly and walk past `PasswordResetGate` without ever choosing a new
 * password. These tests pin the invariant that fixed it: the requirement is
 * cleared only after the auth service confirms a real password change.
 */
describe("completing a forced password reset", () => {
  const strongPassword = "correct-horse-battery-staple";

  function deps(changeResult: PasswordChangeResult) {
    return {
      changePassword: vi.fn(async (): Promise<PasswordChangeResult> => changeResult),
      clearRequirement: vi.fn(async () => undefined),
      recordAudit: vi.fn(async () => undefined),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the requirement once the auth service accepts the new password", async () => {
    const d = deps({ ok: true });

    await expect(completeForcedPasswordReset(strongPassword, d)).resolves.toEqual({ ok: true });

    expect(d.changePassword).toHaveBeenCalledWith(strongPassword);
    expect(d.clearRequirement).toHaveBeenCalledOnce();
    expect(d.recordAudit).toHaveBeenCalledOnce();
  });

  it("leaves the requirement standing when the auth service rejects the password", async () => {
    const d = deps({ ok: false, message: "This password has been found in a data breach." });

    await expect(completeForcedPasswordReset(strongPassword, d)).rejects.toThrow(
      "This password has been found in a data breach.",
    );

    expect(d.changePassword).toHaveBeenCalledOnce();
    expect(d.clearRequirement).not.toHaveBeenCalled();
    expect(d.recordAudit).not.toHaveBeenCalled();
  });

  it("never reaches the auth service or the requirement for a too-short password", async () => {
    const d = deps({ ok: true });
    const tooShort = "a".repeat(MIN_PASSWORD_LENGTH - 1);

    await expect(completeForcedPasswordReset(tooShort, d)).rejects.toThrow(
      `Use at least ${MIN_PASSWORD_LENGTH} characters`,
    );

    expect(d.changePassword).not.toHaveBeenCalled();
    expect(d.clearRequirement).not.toHaveBeenCalled();
  });

  it("rejects a non-string password instead of clearing the requirement", async () => {
    const d = deps({ ok: true });

    await expect(
      completeForcedPasswordReset(undefined as unknown as string, d),
    ).rejects.toThrowError();

    expect(d.changePassword).not.toHaveBeenCalled();
    expect(d.clearRequirement).not.toHaveBeenCalled();
  });

  it("clears the requirement strictly after the password change has settled", async () => {
    const order: string[] = [];
    const d = {
      changePassword: vi.fn(async (): Promise<PasswordChangeResult> => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push("changePassword");
        return { ok: true };
      }),
      clearRequirement: vi.fn(async () => {
        order.push("clearRequirement");
      }),
      recordAudit: vi.fn(async () => {
        order.push("recordAudit");
      }),
    };

    await completeForcedPasswordReset(strongPassword, d);

    expect(order).toEqual(["changePassword", "clearRequirement", "recordAudit"]);
  });

  it("propagates a failure to clear the requirement rather than reporting success", async () => {
    const d = {
      changePassword: vi.fn(async (): Promise<PasswordChangeResult> => ({ ok: true })),
      clearRequirement: vi.fn(async () => {
        throw new Error("Database unavailable");
      }),
      recordAudit: vi.fn(async () => undefined),
    };

    await expect(completeForcedPasswordReset(strongPassword, d)).rejects.toThrow(
      "Database unavailable",
    );
    expect(d.recordAudit).not.toHaveBeenCalled();
  });
});

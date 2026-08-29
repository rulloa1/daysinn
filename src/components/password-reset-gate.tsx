import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { hasPasswordRecoverySession, supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLockup } from "@/components/brand-lockup";
import {
  completePasswordReset,
  getPasswordResetStatus,
  MIN_PASSWORD_LENGTH,
} from "@/lib/password-policy.functions";

/**
 * Blocks the staff portal until an account flagged for a forced reset chooses a
 * new password. Weak or breached passwords are rejected by the auth service.
 *
 * This is a convenience surface, not the enforcement point: the requirement is
 * held server-side and the role guards refuse every guarded server function
 * while it stands, so skipping this component buys nothing.
 */
export function PasswordResetGate({ children }: { children: ReactNode }) {
  const checkStatus = useServerFn(getPasswordResetStatus);
  const finish = useServerFn(completePasswordReset);
  const [required, setRequired] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    // A recovery link is a login link with a new-password obligation attached,
    // so gate on it directly. Otherwise ask the server whether this account
    // still owes a manager-triggered reset — that requirement is server-owned
    // and is deliberately not read from user_metadata, which the account itself
    // can rewrite.
    if (hasPasswordRecoverySession()) {
      setRequired(true);
    } else {
      checkStatus({ data: undefined })
        .then((status) => {
          if (active) setRequired(status.required);
        })
        .catch(() => {
          // Fail closed: if we cannot confirm the account is clear, ask for a
          // password rather than handing over the board.
          if (active) setRequired(true);
        });
    }

    // Covers a recovery event that arrives while this component is already open.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRequired(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [checkStatus]);

  if (required === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-cream/60">
        Loading…
      </div>
    );
  }

  if (!required) return <>{children}</>;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      toast.error("Those passwords don't match.");
      return;
    }
    setBusy(true);
    // The server changes the password and clears the requirement in one call;
    // it will not clear anything if the auth service refuses the password.
    try {
      await finish({ data: { password } });
      setRequired(false);
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update that password.");
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-cream">
      <div className="w-full max-w-sm">
        <BrandLockup tone="cream" />
        <h1 className="mt-8 text-3xl">Set a new password</h1>
        <p className="mt-2 text-sm text-cream/60">
          Before the pilot goes live, every team account needs a fresh, strong password. Minimum{" "}
          {MIN_PASSWORD_LENGTH} characters, and passwords found in known breaches are rejected.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              minLength={MIN_PASSWORD_LENGTH}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              minLength={MIN_PASSWORD_LENGTH}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber text-ink hover:bg-amber/90"
            disabled={busy}
          >
            {busy ? "Saving…" : "Save password"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-4 text-sm text-cream/60 underline-offset-4 hover:text-amber hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

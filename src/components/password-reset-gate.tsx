import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLockup } from "@/components/brand-lockup";
import { completePasswordReset, MIN_PASSWORD_LENGTH } from "@/lib/password-policy.functions";

/**
 * Blocks the staff portal until an account flagged for a forced reset
 * chooses a new password. Weak or breached passwords are rejected by the
 * auth service itself.
 */
export function PasswordResetGate({ children }: { children: ReactNode }) {
  const finish = useServerFn(completePasswordReset);
  const [required, setRequired] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
      setRequired(meta["password_reset_required"] === true);
    });
    return () => {
      active = false;
    };
  }, []);

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
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    try {
      await finish({ data: undefined });
      setRequired(false);
      toast.success("Password updated.");
    } catch {
      toast.error("Password saved, but we couldn't clear the reset flag.");
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

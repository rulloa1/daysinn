import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLockup } from "@/components/brand-lockup";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy.functions";


/** Email/password gate for the whole operations portal. */
export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("The live data service is not configured. Please contact an administrator.");
      return;
    }
    setBusy(true);
    const credentials = { email: email.trim(), password };
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({
            ...credentials,
            options: { emailRedirectTo: `${window.location.origin}/staff` },
          });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (mode === "signup") toast.success("Check your email to confirm the account.");
  }

  async function sendReset() {
    const target = email.trim();
    if (!isSupabaseConfigured) {
      toast.error("The live data service is not configured. Please contact an administrator.");
      return;
    }
    if (!target) {
      toast.error("Enter your email address first, then choose Forgot password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/staff`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Deliberately not confirming whether the address exists.
    toast.success("If that address has an account, a reset link is on its way.");
  }

  return (
    <main className="ops-surface flex min-h-screen items-center justify-center bg-ink px-6 py-12 text-cream">
      <section className="w-full max-w-md border border-cream/15 bg-cream/[0.04] p-8 shadow-2xl shadow-black/30">
        <BrandLockup tone="cream" />
        <p className="signage mt-8 text-cream/60">Operations portal</p>
        <h1 className="mt-2 text-3xl">Staff sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-cream/60">
          Sign in to access the live room status, housekeeping, and guest-service boards.
        </p>
        {!isSupabaseConfigured ? (
          <p className="mt-4 border border-status-dirty/60 bg-status-dirty/10 p-3 text-sm text-status-dirty">
            The live data service is not configured.
          </p>
        ) : null}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@daysinn.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!isSupabaseConfigured}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!isSupabaseConfigured}
              minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : 6}
              required
            />
            {mode === "signup" ? (
              <p className="text-xs text-cream/50">
                At least {MIN_PASSWORD_LENGTH} characters. Passwords found in known breaches are
                rejected.
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={busy || !isSupabaseConfigured}
            className="w-full bg-amber font-bold text-ink hover:bg-amber/90"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        {isSupabaseConfigured && mode === "signin" ? (
          <button
            type="button"
            onClick={sendReset}
            disabled={busy}
            className="mt-4 w-full text-center text-sm text-cream/60 underline-offset-4 hover:text-amber hover:underline"
          >
            Forgot password?
          </button>
        ) : null}
        {isSupabaseConfigured ? (
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-sm text-cream/60 underline-offset-4 hover:text-amber hover:underline"
          >
            {mode === "signin"
              ? "Need a staff account? Create one"
              : "Already have an account? Sign in"}
          </button>
        ) : null}
        <Link to="/" className="signage mt-7 inline-block text-cream/50 hover:text-amber">
          ← Guest view
        </Link>
      </section>
    </main>
  );
}

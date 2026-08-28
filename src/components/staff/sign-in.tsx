import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLockup } from "@/components/brand-lockup";

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
              minLength={6}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={busy || !isSupabaseConfigured}
            className="w-full bg-amber font-bold text-ink hover:bg-amber/90"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
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

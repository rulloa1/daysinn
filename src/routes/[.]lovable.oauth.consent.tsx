import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OauthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: unknown; error: unknown }>;
  approveAuthorization: (id: string) => Promise<{ data: unknown; error: unknown }>;
  denyAuthorization: (id: string) => Promise<{ data: unknown; error: unknown }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OauthNamespace }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: ({ search }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-cream">
      <p className="max-w-md text-sm text-cream/70">
        Could not load this authorization request: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const { authorization_id } = Route.useSearch();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    oauth()
      .getAuthorizationDetails(authorization_id)
      .then((res) => {
        if (!active) return;
        const error = res.error as { message?: string } | null;
        const data = res.data as Record<string, unknown> | null;
        if (error) {
          setError(error.message ?? "Authorization failed.");
          return;
        }
        const immediate = (data?.["redirect_url"] ?? data?.["redirect_to"]) as string | undefined;
        if (immediate && !data?.["client"]) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      });
    return () => {
      active = false;
    };
  }, [signedIn, authorization_id]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const res = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    const error = res.error as { message?: string } | null;
    const data = res.data as Record<string, unknown> | null;
    if (error) {
      setBusy(false);
      setError(error.message ?? "Authorization failed.");
      return;
    }
    const target = (data?.["redirect_url"] ?? data?.["redirect_to"]) as string | undefined;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-12 text-cream">
      <div className="w-full max-w-md rounded-2xl border border-cream/15 bg-cream/[0.04] p-8 shadow-2xl shadow-black/30">
        {children}
        {error && (
          <p role="alert" className="mt-4 text-sm text-amber">
            {error}
          </p>
        )}
      </div>
    </main>
  );

  if (signedIn === null) return shell(<p className="text-sm text-cream/60">Loading…</p>);

  if (!signedIn)
    return shell(
      <>
        <h1 className="text-3xl leading-tight">Sign in to continue</h1>
        <p className="mt-2 text-sm text-cream/60">
          Sign in with your staff account to connect an assistant to this hub.
        </p>
        <form onSubmit={signIn} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consent-email">Email</Label>
            <Input
              id="consent-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consent-password">Password</Label>
            <Input
              id="consent-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </>,
    );

  if (!details) return shell(<p className="text-sm text-cream/60">Loading request…</p>);

  const clientName = details?.client?.name ?? "an app";
  return shell(
    <>
      <h1 className="text-3xl leading-tight">Connect {clientName}</h1>
      <p className="mt-3 text-sm text-cream/70">
        This lets {clientName} read and update the hotel boards as you, with your role's
        permissions.
      </p>
      <div className="mt-6 flex gap-3">
        <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
          Approve
        </Button>
        <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">
          Deny
        </Button>
      </div>
    </>,
  );
}

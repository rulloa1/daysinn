import { Link } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState, type ReactNode } from "react";

import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStaffRole, type AppRole } from "@/hooks/use-staff-role";

/**
 * Client-side staff gate for internal pages that are not part of the guest site
 * — the training manuals, the owner pitch and the printable room collateral.
 *
 * These carry PIN-reset procedures, room lists and sign-in QR artwork, so they
 * should not be readable by anyone who guesses the URL. Routes using this must
 * set `ssr: false`, since the session only exists in the browser.
 *
 * Pass `requireRole` for pages that a session alone shouldn't open — the
 * manager manual documents role and PIN administration, so being signed in as
 * a housekeeper is not enough.
 */
export function StaffOnly({
  title,
  blurb = "Sign in with your staff account to open this page.",
  requireRole,
  children,
}: {
  title: string;
  blurb?: string;
  requireRole?: AppRole;
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const { roles, loading: rolesLoading } = useStaffRole();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready || (requireRole && rolesLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-ops text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-deep px-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-md">
          <BrandLockup tone="cream" />
          <h1 className="mt-8 font-serif text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-white/70">{blurb}</p>
          <Button
            asChild
            className="mt-6 w-full bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
          >
            <Link to="/staff-login">Go to staff sign-in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (requireRole && !roles.includes(requireRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-deep px-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-white/5 p-8 backdrop-blur-md">
          <BrandLockup tone="cream" />
          <h1 className="mt-8 font-serif text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-white/70">
            This page is limited to property managers. Ask a manager if you need what&apos;s in it.
          </p>
          <Button
            asChild
            className="mt-6 w-full bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
          >
            <Link to="/staff">Back to the staff portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/brand-lockup";
import { TeamPanel } from "@/components/team-panel";
import { useStaffRole } from "@/hooks/use-staff-role";

export const Route = createFileRoute("/roles")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Role management — Days Inn® by Wyndham Wildwood" },
      {
        name: "description",
        content:
          "Managers grant and revoke manager, staff, and viewer access for the Days Inn Wildwood team portal.",
      },
      { property: "og:title", content: "Role management — Days Inn Wildwood" },
      {
        property: "og:description",
        content:
          "Grant or revoke manager access for the Days Inn Wildwood staff portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const role = useStaffRole(session?.user.id ?? null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-ink text-cream">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <BrandLockup />
          <nav className="flex flex-wrap gap-4 text-sm text-cream/70">
            <Link to="/staff" className="hover:text-cream">
              Staff queue
            </Link>
            <Link to="/front-desk" className="hover:text-cream">
              Front desk
            </Link>
            <Link to="/housekeeping" className="hover:text-cream">
              Housekeeping
            </Link>
          </nav>
        </header>

        <h1 className="mt-10 font-display text-3xl">Role management</h1>
        <p className="mt-2 max-w-2xl text-sm text-cream/60">
          Move people between manager and non-manager access. Managers can
          change roles and invite staff; staff can triage the queue; viewers can
          only watch.
        </p>

        {!ready || role.loading ? (
          <p className="mt-10 text-sm text-cream/60">Loading…</p>
        ) : !session ? (
          <p className="mt-10 text-sm text-cream/70">
            Please{" "}
            <Link to="/staff" className="text-amber underline">
              sign in
            </Link>{" "}
            to manage roles.
          </p>
        ) : !role.isManager ? (
          <p className="mt-10 text-sm text-cream/70">
            Only managers can change roles. Ask a manager to grant you access.
          </p>
        ) : (
          <TeamPanel />
        )}
      </div>
    </main>
  );
}

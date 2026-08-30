import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { TeamPanel } from "@/components/team-panel";
import { useStaffRole } from "@/hooks/use-staff-role";
import { canViewScreen } from "@/lib/screen-access";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { NavRail } from "@/components/front-desk/nav-rail";
import { OpsScreenSwitcher } from "@/components/ops/screen-switcher";
import { StaffErrorBoundary, StaffErrorFallback } from "@/components/staff-error-boundary";

export const Route = createFileRoute("/roles")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Team & Role Management — Days Inn Hub" },
      {
        name: "description",
        content:
          "Manager team roster, role permissions matrix, and shift scheduling for Days Inn Wildwood.",
      },
      { property: "og:title", content: "Team & Role Management — Days Inn Hub" },
      {
        property: "og:description",
        content: "Grant or update role access and team PINs for Days Inn staff.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/staff-login" });
  },
  errorComponent: ({ error, reset }) => <StaffErrorFallback error={error} reset={reset} />,
  component: RolesPage,
});

function RolesPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const role = useStaffRole();
  const { staff } = useStaffIdentity();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      if (!data.session) void navigate({ to: "/staff-login", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => {
      setSession(next);
      if (!next) void navigate({ to: "/staff-login", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // Every other ops route refuses before it paints; this one used to render the
  // rail, the switcher and a staff avatar around a "please sign in" card.
  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#a8b7ca] text-sm text-slate-600">
        Loading team permissions…
      </div>
    );
  }

  return (
    <div className="ops-portal flex min-h-screen">
      <NavRail current="roles" staff={staff} />

      <main className="flex-1 overflow-y-auto">
        <OpsScreenSwitcher current="roles" />
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 lg:px-10">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              Management &amp; Access Control
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#004986]">
              Team &amp; Role Management
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              Manage team members, assign department roles, and enforce security policies.
            </p>
          </div>

          {role.loading ? (
            <div className="mt-12 flex h-32 items-center justify-center text-xs font-semibold text-slate-400">
              Loading team permissions…
            </div>
          ) : !canViewScreen(role.roles, "roles") ? (
            <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-xs">
              <p className="text-xs font-bold text-amber-800 uppercase">Manager Access Required</p>
              <p className="mt-1 text-xs text-amber-900">
                Only property managers can view and modify role assignments.
              </p>
            </div>
          ) : (
            <StaffErrorBoundary id="roles-team">
              <TeamPanel />
            </StaffErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
}

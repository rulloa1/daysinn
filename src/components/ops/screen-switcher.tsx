import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useStaffRole } from "@/hooks/use-staff-role";
import { canViewScreen } from "@/lib/screen-access";
import { signOutStaff } from "@/lib/staff-signout";

export type OpsScreen = "front-desk" | "housekeeping" | "queue" | "team" | "roles" | "shifts";

type Target = { id: OpsScreen; label: string; to: string; search?: Record<string, string> };

const TARGETS: Target[] = [
  { id: "front-desk", label: "Front desk", to: "/staff", search: { tab: "map" } },
  { id: "housekeeping", label: "Housekeeping", to: "/housekeeping" },
  { id: "queue", label: "Request queue", to: "/staff" },
  { id: "team", label: "Team & invites", to: "/staff", search: { tab: "team" } },
  { id: "roles", label: "Roles", to: "/roles" },
  { id: "shifts", label: "Shifts", to: "/staff", search: { tab: "schedules" } },
];

/**
 * Sticky screen switcher from the Ops Portal v3 design: a translucent white bar
 * with an uppercase eyebrow, pill buttons per screen, and a right-side note.
 *
 * Only screens the signed-in role may open are listed, so navigation never
 * offers a destination the guard will refuse.
 */
export function OpsScreenSwitcher({ current }: { current: OpsScreen }) {
  const { roles, loading } = useStaffRole();
  const targets = loading ? [] : TARGETS.filter((t) => canViewScreen(roles, t.id));

  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function logOff() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutStaff();
    } finally {
      void navigate({ to: "/staff-login", replace: true });
    }
  }

  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center gap-2.5 border-b border-[#D8E0EA] bg-white/92 px-4 py-2.5 backdrop-blur-md md:px-6">
      <span className="mr-1.5 text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
        Ops portal
      </span>
      {targets.map((target) => {
        const on = target.id === current;
        return (
          <Link
            key={target.id}
            to={target.to}
            {...(target.search ? { search: target.search } : {})}
            className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
              on
                ? "border-[#004986] bg-[#004986] text-white"
                : "border-[#C4D0DE] bg-[#EDF2F8] text-[#004986] hover:bg-[#E1E9F3]"
            }`}
          >
            {target.label}
          </Link>
        );
      })}
      <span className="ml-auto hidden text-[0.72rem] text-slate-400 lg:block">
        One next action, always visible
      </span>
      <button
        type="button"
        onClick={logOff}
        disabled={signingOut}
        title="Log off"
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#C4D0DE] bg-[#EDF2F8] px-3.5 py-2 text-xs font-bold text-[#004986] transition hover:border-[#B91C1C] hover:bg-[#FEE2E2] hover:text-[#B91C1C] lg:ml-0"
      >
        <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
        {signingOut ? "Logging off…" : "Log off"}
      </button>
    </div>
  );
}

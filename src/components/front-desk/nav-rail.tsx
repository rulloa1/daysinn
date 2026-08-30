import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Gauge,
  LayoutGrid,
  ListFilter,
  DoorClosed,
  Shield,
  BarChart3,
  Printer,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import type { StaffIdentity } from "@/lib/ops";
import { signOutStaff } from "@/lib/staff-signout";
import { useStaffRole } from "@/hooks/use-staff-role";
import { canViewScreen, type OpsScreenId } from "@/lib/screen-access";

type RailItem = {
  id: OpsScreenId;
  label: string;
  to: string;
  search?: Record<string, string>;
  icon: typeof LayoutGrid;
};

/**
 * The rail and the screen switcher answer to the same policy table, so a role
 * is never offered a destination its guard will refuse. Ids are screen ids for
 * that reason — one vocabulary across both navigations.
 */
const ITEMS: RailItem[] = [
  { id: "overview", label: "Overview", to: "/staff", search: { tab: "overview" }, icon: Gauge },
  { id: "front-desk", label: "Board", to: "/front-desk", icon: LayoutGrid },
  { id: "queue", label: "Queue", to: "/staff", search: { tab: "queue" }, icon: ListFilter },
  { id: "housekeeping", label: "Rooms", to: "/housekeeping", icon: DoorClosed },
  { id: "collateral", label: "Print", to: "/collateral", icon: Printer },
  { id: "roles", label: "Roles", to: "/roles", icon: Shield },
  {
    id: "analytics",
    label: "Reports",
    to: "/staff",
    search: { tab: "analytics" },
    icon: BarChart3,
  },
];

interface NavRailProps {
  /** The screen being shown. Falls back to the current path when omitted. */
  current?: OpsScreenId;
  staff?: StaffIdentity | null;
}

/** Best-effort screen id for a path, used only when `current` is not given. */
function screenForPath(path: string): OpsScreenId | null {
  if (path.startsWith("/front-desk")) return "front-desk";
  if (path.startsWith("/housekeeping")) return "housekeeping";
  if (path.startsWith("/collateral")) return "collateral";
  if (path.startsWith("/roles")) return "roles";
  if (path.startsWith("/staff")) return "queue";
  return null;
}

export function NavRail({ current, staff }: NavRailProps) {
  const routerState = useRouterState();
  const { roles, loading } = useStaffRole();

  const activeItem = current ?? screenForPath(routerState.location.pathname);
  const items = loading ? [] : ITEMS.filter((item) => canViewScreen(roles, item.id));

  const initials = staff?.name
    ? staff.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "FD";

  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function logOff() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutStaff();
      toast.success("Logged off successfully. See you next shift!");
    } catch {
      toast.error("Couldn't log off — please try again.");
    } finally {
      void navigate({ to: "/staff-login", replace: true });
    }
  }

  return (
    <nav
      aria-label="Staff navigation"
      className="hidden min-h-screen w-[76px] flex-col items-center gap-5 bg-[#004986] py-5 md:flex"
    >
      {/* Brand logo plate */}
      <Link
        to="/front-desk"
        className="flex w-14 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm transition hover:opacity-95"
      >
        <img
          src={logoAsset.url}
          alt="Days Inn by Wyndham"
          className="h-auto w-full max-w-[46px] object-contain"
        />
      </Link>

      <div className="mt-2 flex flex-col items-center gap-4">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.to}
              {...(item.search ? { search: item.search } : {})}
              aria-current={isActive ? "page" : undefined}
              className="group flex flex-col items-center gap-1.5 text-center transition"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl transition ${
                  isActive
                    ? "bg-[#D4AF37] text-[#004986] shadow-sm"
                    : "bg-white/12 text-white group-hover:bg-white/20"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span
                className={`text-[9px] font-bold tracking-wider uppercase transition ${
                  isActive ? "text-white" : "text-white/60 group-hover:text-white/90"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Staff profile badge + log off */}
      <div className="mt-auto flex flex-col items-center gap-4 pt-4">
        <div
          title={staff ? staff.name : "Front Desk"}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#004986] shadow-sm ring-2 ring-white/20"
        >
          {initials}
        </div>
        <button
          type="button"
          onClick={logOff}
          disabled={signingOut}
          title="Log off"
          className="group flex flex-col items-center gap-1.5 text-center transition"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/12 text-white transition group-hover:bg-[#B91C1C] group-hover:text-white">
            <LogOut className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-[9px] font-bold tracking-wider text-white/60 uppercase transition group-hover:text-white">
            {signingOut ? "Bye…" : "Log off"}
          </span>
        </button>
      </div>
    </nav>
  );
}

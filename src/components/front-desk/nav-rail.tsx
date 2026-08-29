import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  ListFilter,
  DoorClosed,
  Users,
  Shield,
  Calendar,
  BarChart3,
  Printer,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import type { StaffIdentity } from "@/lib/ops";
import { signOutStaff } from "@/lib/staff-signout";

interface NavRailProps {
  current?: "board" | "queue" | "rooms" | "team" | "roles" | "shifts" | "reports" | "print";
  staff?: StaffIdentity | null;
}

export function NavRail({ current = "board", staff }: NavRailProps) {
  const routerState = useRouterState();
  const path = routerState.location.pathname;

  const activeItem =
    current ||
    (path.startsWith("/front-desk")
      ? "board"
      : path.startsWith("/housekeeping")
        ? "rooms"
        : path.startsWith("/collateral")
          ? "print"
          : path.startsWith("/manuals")
            ? "manuals"
            : path.startsWith("/roles")
              ? "roles"
              : path.startsWith("/staff")
                ? "queue"
                : "board");

  const items = [
    {
      id: "board",
      label: "Board",
      href: "/front-desk",
      icon: LayoutGrid,
    },
    {
      id: "queue",
      label: "Queue",
      href: "/staff",
      icon: ListFilter,
    },
    {
      id: "rooms",
      label: "Rooms",
      href: "/housekeeping",
      icon: DoorClosed,
    },
    {
      id: "print",
      label: "Print",
      href: "/collateral",
      icon: Printer,
    },
    {
      id: "roles",
      label: "Roles",
      href: "/roles",
      icon: Shield,
    },
    {
      id: "reports",
      label: "Reports",
      href: "/staff",
      icon: BarChart3,
    },
  ] as const;

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
              to={item.href}
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
          <span className="text-[9px] font-bold tracking-wider uppercase transition text-white/60 group-hover:text-white">
            {signingOut ? "Bye…" : "Log off"}
          </span>
        </button>
      </div>
    </nav>
  );
}

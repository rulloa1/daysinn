import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLockup } from "@/components/brand-lockup";

const DESKTOP_LINK = "text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:text-[#004986]";
const SHEET_LINK =
  "rounded-xl border border-slate-200 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:bg-slate-100";

/** Destinations shared by the desktop nav and the mobile sheet. */
function navTargets(isManager: boolean) {
  const targets: { to: "/front-desk" | "/housekeeping" | "/roles" | "/"; label: string }[] = [
    { to: "/front-desk", label: "Front desk" },
    { to: "/housekeeping", label: "Housekeeping" },
  ];
  if (isManager) targets.push({ to: "/roles", label: "Roles" });
  targets.push({ to: "/", label: "Guest view" });
  return targets;
}

export function DashboardHeader({ isManager }: { isManager: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const targets = navTargets(isManager);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div className="flex min-w-0 items-center gap-4">
        <BrandLockup tone="ink" />
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <nav className="hidden items-center gap-5 md:flex">
          {targets.map((target) => (
            <Link key={target.to} to={target.to} className={DESKTOP_LINK}>
              {target.label}
            </Link>
          ))}
        </nav>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[80vw] max-w-xs border-slate-200 bg-white text-slate-800"
          >
            <SheetHeader>
              <SheetTitle className="text-left font-serif text-lg text-[#004986]">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-3">
              {targets.map((target) => (
                <Link
                  key={target.to}
                  to={target.to}
                  onClick={() => setMenuOpen(false)}
                  className={SHEET_LINK}
                >
                  {target.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

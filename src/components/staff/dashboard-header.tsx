import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLockup } from "@/components/brand-lockup";

const DESKTOP_LINK = "signage text-cream/60 transition-colors duration-200 hover:text-amber";
const SHEET_LINK =
  "signage rounded-lg border border-cream/15 px-4 py-3 text-center text-cream/80 transition-colors duration-200 hover:bg-cream/10 hover:text-cream";

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
    <header className="sticky top-0 z-20 -mx-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-cream/15 bg-ink/70 px-6 py-4 backdrop-blur-xl md:-mx-12 md:flex md:flex-wrap md:justify-between md:px-12">
      <div className="flex min-w-0 items-center gap-5">
        <BrandLockup tone="cream" />
        <div className="hidden h-8 w-px bg-cream/15 md:block" />
        <div className="hidden min-w-0 md:block">
          <p className="signage flex items-center gap-2 text-cream/60">
            <span aria-hidden className="h-3 w-[3px] bg-amber" />
            Live shift
          </p>
          <h1 className="mt-1 truncate font-display text-2xl leading-none">Request queue</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <nav className="hidden items-center gap-4 md:flex">
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
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cream/25 text-cream transition-colors duration-200 hover:bg-cream/10 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[80vw] max-w-xs border-cream/15 bg-ink text-cream"
          >
            <SheetHeader>
              <SheetTitle className="text-left text-cream">Menu</SheetTitle>
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

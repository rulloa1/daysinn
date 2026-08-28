import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLockup } from "@/components/brand-lockup";
import { BOOKING_URL } from "@/components/franchise-footer";

const DESKTOP_LINK =
  "signage hidden text-muted-foreground transition-colors duration-200 hover:text-primary sm:inline-flex";
const SHEET_LINK =
  "rounded-xl border border-border/80 bg-card px-4 py-3 text-center text-sm font-semibold text-foreground";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 px-4 py-3.5 backdrop-blur-xl transition-all duration-200 md:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="min-w-0">
          <BrandLockup />
        </div>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="spring-hover inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-sm hover:brightness-105"
          >
            Book direct ↗
          </a>
          <Link
            to="/checkin"
            search={{}}
            className="spring-hover hidden rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-110 sm:inline-flex"
          >
            Sign in to room
          </Link>
          <Link to="/guide" className={DESKTOP_LINK}>
            Local guide
          </Link>
          <Link to="/track" className={DESKTOP_LINK}>
            Track request
          </Link>
          <Link to="/staff" className={DESKTOP_LINK}>
            Staff
          </Link>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card/60 text-foreground backdrop-blur sm:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[82vw] max-w-xs border-l border-border/80 bg-background/95 backdrop-blur-2xl"
            >
              <SheetHeader>
                <SheetTitle className="text-left font-serif text-lg text-foreground">
                  Guest Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-3">
                <Link
                  to="/checkin"
                  search={{}}
                  onClick={close}
                  className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm"
                >
                  Sign in to your room
                </Link>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={close}
                  className="rounded-xl bg-accent px-4 py-3 text-center text-sm font-bold text-accent-foreground shadow-sm"
                >
                  Book direct rates
                </a>
                <Link to="/room" onClick={close} className={SHEET_LINK}>
                  In-room guest hub
                </Link>
                <Link to="/guide" onClick={close} className={SHEET_LINK}>
                  Local area guide
                </Link>
                <Link to="/track" onClick={close} className={SHEET_LINK}>
                  Track a request
                </Link>
                <Link to="/staff" onClick={close} className={SHEET_LINK}>
                  Staff portal
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLockup } from "@/components/brand-lockup";
import { BOOKING_URL } from "@/components/franchise-footer";

/** In-page anchors, matching the section ids on the homepage. */
const SECTIONS = [
  { href: "#rooms", label: "Rooms" },
  { href: "#amenities", label: "Amenities" },
  { href: "#gallery", label: "Gallery" },
  { href: "#location", label: "Location" },
];

const NAV_LINK =
  "signage font-bold text-white/70 transition-colors duration-200 hover:text-white focus-visible:text-white";
const SHEET_LINK =
  "rounded-xl border border-border/80 bg-card px-4 py-3 text-center text-sm font-semibold text-foreground";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--gh-blue)] px-[clamp(1.25rem,5vw,2.5rem)] py-3.5">
      <div className="flex items-center justify-between gap-6">
        <BrandLockup tone="cream" plate />

        <div className="flex shrink-0 items-center gap-4 lg:gap-[22px]">
          <nav className="hidden items-center gap-[22px] lg:flex">
            {SECTIONS.map((section) => (
              <a key={section.href} href={section.href} className={NAV_LINK}>
                {section.label}
              </a>
            ))}
          </nav>

          <Link to="/checkin" search={{}} className={`hidden sm:inline-flex ${NAV_LINK}`}>
            Sign in
          </Link>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="spring-hover shrink-0 whitespace-nowrap rounded-[10px] bg-[var(--gh-gold)] px-[18px] py-[11px] text-[0.82rem] font-bold text-[var(--gh-blue)] shadow-sm hover:brightness-105"
          >
            Book direct ↗
          </a>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 text-white lg:hidden"
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
                {SECTIONS.map((section) => (
                  <a key={section.href} href={section.href} onClick={close} className={SHEET_LINK}>
                    {section.label}
                  </a>
                ))}
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

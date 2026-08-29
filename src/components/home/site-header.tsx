import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Phone, Sparkles, Award } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLockup } from "@/components/brand-lockup";
import { BOOKING_URL } from "@/components/franchise-footer";

/** In-page anchors, matching the section ids on the homepage. */
const SECTIONS = [
  { href: "#rooms", label: "Rooms & Rates" },
  { href: "#amenities", label: "Amenities" },
  { href: "#rewards", label: "Wyndham Rewards" },
  { href: "#location", label: "Local Guide" },
  { href: "#gallery", label: "Gallery" },
];

const NAV_LINK =
  "signage font-bold text-white/75 transition-colors duration-200 hover:text-white focus-visible:text-white";
const SHEET_LINK =
  "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--gh-blue)]/95 px-[clamp(1.25rem,5vw,2.5rem)] py-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <BrandLockup tone="cream" plate />
        </div>

        <div className="flex shrink-0 items-center gap-3 lg:gap-5">
          <nav className="hidden items-center gap-5 lg:flex">
            {SECTIONS.map((section) => (
              <a key={section.href} href={section.href} className={NAV_LINK}>
                {section.label}
              </a>
            ))}
          </nav>

          <a
            href="tel:+13527487766"
            className="hidden items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 md:inline-flex"
          >
            <Phone className="h-3.5 w-3.5 text-[var(--gh-gold)]" />
            <span>(352) 748-7766</span>
          </a>

          <Link to="/checkin" search={{}} className={`hidden sm:inline-flex ${NAV_LINK}`}>
            Guest sign in
          </Link>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="spring-hover shrink-0 whitespace-nowrap rounded-[10px] bg-[var(--gh-gold)] px-[18px] py-[10px] text-[0.82rem] font-bold text-[var(--gh-blue-deep)] shadow-sm hover:brightness-105"
          >
            Book direct ↗
          </a>

          {/* Mobile Navigation Drawer */}
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
              className="w-[85vw] max-w-xs border-l border-white/10 bg-[#00243F] text-white p-6"
            >
              <SheetHeader>
                <SheetTitle className="text-left font-serif text-lg text-white">
                  Days Inn Wildwood
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2.5">
                {SECTIONS.map((section) => (
                  <a key={section.href} href={section.href} onClick={close} className={SHEET_LINK}>
                    {section.label}
                  </a>
                ))}

                <a
                  href="tel:+13527487766"
                  onClick={close}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[var(--gh-gold)]/40 bg-white/10 px-4 py-3 text-center text-xs font-bold text-[var(--gh-gold)]"
                >
                  <Phone className="h-4 w-4" />
                  Call Desk (352) 748-7766
                </a>

                <Link
                  to="/checkin"
                  search={{}}
                  onClick={close}
                  className="rounded-xl bg-[#D4AF37] px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#004986]"
                >
                  Sign in to room
                </Link>
                <Link
                  to="/staff-login"
                  onClick={close}
                  className="rounded-xl border border-white/15 bg-transparent px-4 py-3 text-center text-xs font-semibold text-white/60"
                >
                  Staff login
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


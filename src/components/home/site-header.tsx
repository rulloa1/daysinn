import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import { BOOKING_URL } from "@/components/franchise-footer";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-[#004986] px-5 py-3.5 shadow-md md:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        {/* Brand Lockup: Logo on white plate + stacked labels */}
        <Link to="/" className="flex items-center gap-3.5">
          <span className="flex h-9 w-16 items-center justify-center rounded-lg bg-white p-1 shadow-xs">
            <img
              src={logoAsset.url}
              alt="Days Inn by Wyndham"
              className="h-auto w-full object-contain"
            />
          </span>
          <span className="hidden border-l border-white/30 pl-3 leading-tight sm:block">
            <span className="block text-[11px] font-bold tracking-widest text-white uppercase">
              Guest Hub
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold tracking-wider text-white/60 uppercase">
              Days Inn® by Wyndham
            </span>
          </span>
        </Link>

        {/* Desktop Anchor Navigation & Book Direct Button */}
        <div className="flex items-center gap-4 md:gap-6">
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#rooms"
              className="text-[11px] font-bold tracking-widest text-white/75 uppercase transition hover:text-white"
            >
              Rooms
            </a>
            <a
              href="#amenities"
              className="text-[11px] font-bold tracking-widest text-white/75 uppercase transition hover:text-white"
            >
              Amenities
            </a>
            <a
              href="#gallery"
              className="text-[11px] font-bold tracking-widest text-white/75 uppercase transition hover:text-white"
            >
              Gallery
            </a>
            <a
              href="#location"
              className="text-[11px] font-bold tracking-widest text-white/75 uppercase transition hover:text-white"
            >
              Location
            </a>
          </nav>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#004986] shadow-sm transition hover:bg-[#D4AF37]/90 active:scale-[0.98]"
          >
            Book direct ↗
          </a>

          {/* Mobile Navigation Drawer */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/25 bg-white/10 text-white transition hover:bg-white/20 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[82vw] max-w-xs border-l border-slate-200 bg-[#00243F] text-white p-6"
            >
              <SheetHeader>
                <SheetTitle className="text-left font-serif text-lg text-white">
                  Days Inn Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-3">
                <a
                  href="#rooms"
                  onClick={close}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white"
                >
                  Rooms &amp; Suites
                </a>
                <a
                  href="#amenities"
                  onClick={close}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white"
                >
                  Amenities
                </a>
                <a
                  href="#gallery"
                  onClick={close}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white"
                >
                  Photo Gallery
                </a>
                <a
                  href="#location"
                  onClick={close}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white"
                >
                  Location &amp; Access
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
                  to="/staff"
                  onClick={close}
                  className="rounded-xl border border-white/15 bg-transparent px-4 py-3 text-center text-xs font-semibold text-white/60"
                >
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

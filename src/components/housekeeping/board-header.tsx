import { Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";

const NAV_LINK = "signage text-cream/60 transition-colors duration-200 hover:text-amber";

export function BoardHeader({
  staffName,
  onSignOut,
}: {
  staffName: string;
  onSignOut: () => void;
}) {
  return (
    <header className="border-b border-cream/15 pb-4 sm:pb-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <BrandLockup tone="cream" />
          <p className="signage mt-4 flex items-center gap-2 text-cream/60 sm:mt-5">
            <span aria-hidden className="h-3 w-[3px] shrink-0 bg-amber" />
            <span className="truncate">Housekeeping · {staffName}</span>
          </p>
          <h1 className="mt-2 truncate text-2xl sm:text-4xl">Rooms to turn</h1>
          <nav className="mt-3 flex flex-wrap gap-4">
            <Link to="/staff" className={NAV_LINK}>
              Staff queue
            </Link>
            <Link to="/front-desk" className={NAV_LINK}>
              Front desk
            </Link>
            <Link to="/" className={NAV_LINK}>
              Guest view
            </Link>
          </nav>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="signage shrink-0 border border-cream/20 px-3 py-2 text-cream/60 transition-colors duration-200 hover:text-amber"
        >
          End shift
        </button>
      </div>
    </header>
  );
}

/** Compact stat tile for the housekeeping counters. */
export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-cream/15 bg-cream/[0.03] px-3 py-3">
      <p className="signage text-cream/45">{label}</p>
      <p className="mt-1 text-2xl">{value}</p>
    </div>
  );
}

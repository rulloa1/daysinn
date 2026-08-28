import { Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { MetricsExportButton } from "@/components/metrics-export-button";
import type { StaffIdentity } from "@/lib/ops";
import { StaffPicker } from "./staff-picker";

const NAV_LINK = "signage text-cream/60 transition-colors duration-200 hover:text-amber";

export function BoardHeader({
  members,
  staff,
  onSelectStaff,
  onAddMember,
}: {
  members: { id: string; name: string }[];
  staff: StaffIdentity;
  onSelectStaff: (next: StaffIdentity) => void;
  onAddMember: (name: string) => Promise<unknown>;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/15 pb-6">
      <div>
        <BrandLockup tone="cream" />
        <p className="signage mt-6 flex items-center gap-2 text-cream/60">
          <span aria-hidden className="h-3 w-[3px] bg-amber" />
          Front desk · Shift board
        </p>
        <h1 className="mt-3 text-4xl">Front desk board</h1>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <StaffPicker members={members} staff={staff} onSelect={onSelectStaff} onAdd={onAddMember} />
        <MetricsExportButton />
        <Link
          to="/live-room-status"
          className="signage text-amber transition-colors duration-200 hover:text-cream"
        >
          Live room status
        </Link>
        <Link to="/staff" className={NAV_LINK}>
          Request queue
        </Link>
        <Link to="/housekeeping" className={NAV_LINK}>
          Housekeeping
        </Link>
        <Link to="/checkin" search={{}} className={NAV_LINK}>
          Guest sign-in
        </Link>
        <Link to="/" className={NAV_LINK}>
          Guest view
        </Link>
      </div>
    </header>
  );
}

import { Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { SCREEN_ACCESS, type OpsScreenId } from "@/lib/screen-access";

/**
 * The shared "your role can't open this" screen. Access decisions live in
 * `screen-access.ts`; this only presents the refusal and a route the user can
 * actually use.
 */
export function ScreenDenied({
  screen,
  suggestion,
}: {
  screen: OpsScreenId;
  suggestion?: { to: string; label: string } | null;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#00243F] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-white/5 p-8 text-center backdrop-blur-md">
        <BrandLockup tone="cream" />
        <p className="mt-6 text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
          Restricted access
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold">{SCREEN_ACCESS[screen].label}</h1>
        <p className="mt-3 text-sm text-white/70">
          Your role doesn&apos;t include this screen. Ask a manager to grant the access you need.
        </p>
        {suggestion ? (
          <Button
            asChild
            className="mt-6 w-full bg-[#D4AF37] font-bold text-[#004986] hover:bg-[#D4AF37]/90"
          >
            <Link to={suggestion.to}>{suggestion.label}</Link>
          </Button>
        ) : null}
        <Link
          to="/"
          className="mt-6 inline-block text-xs font-semibold tracking-wider text-white/60 uppercase transition hover:text-[#D4AF37]"
        >
          ← Guest view
        </Link>
      </div>
    </div>
  );
}

/** Inline refusal used for a panel inside an otherwise permitted screen. */
export function PanelDenied({ screen }: { screen: OpsScreenId }) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-xs">
      <p className="text-xs font-bold text-amber-800 uppercase">Manager access required</p>
      <p className="mt-1 text-xs text-amber-900">
        {SCREEN_ACCESS[screen].label} is limited to roles a manager has approved for it.
      </p>
    </div>
  );
}

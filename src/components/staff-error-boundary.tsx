import { CatchBoundary } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

function isAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Authentication required") ||
    message.includes("Unauthorized") ||
    message.includes("authentication_required") ||
    message.includes("JWT") ||
    message.includes("401")
  );
}

/**
 * Friendly fallback for staff/team screens. Auth failures get a sign-in prompt
 * instead of the blank screen a thrown server-function error would produce.
 */
export function StaffErrorFallback({ error, reset }: { error: unknown; reset?: () => void }) {
  const authIssue = isAuthError(error);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#EEF2F7] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
          {authIssue ? "Session expired" : "Something went wrong"}
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[#004986]">
          {authIssue ? "Please sign in again" : "This page couldn't load"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {authIssue
            ? "Your staff session is no longer valid. Sign in to the staff portal to continue."
            : "We hit an unexpected problem loading this page. Try again, or sign in to the staff portal."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-[#004986] text-white hover:bg-[#004986]/90">
            <a href="/staff">Go to staff sign-in</a>
          </Button>

          {reset ? (
            <Button variant="outline" onClick={reset}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function StaffErrorBoundary({ id, children }: { id: string; children: ReactNode }) {
  return (
    <CatchBoundary
      getResetKey={() => id}
      errorComponent={({ error, reset }) => <StaffErrorFallback error={error} reset={reset} />}
    >
      {children}
    </CatchBoundary>
  );
}

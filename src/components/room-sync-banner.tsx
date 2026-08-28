import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const plural = (n: number) => (n === 1 ? "" : "s");

/**
 * Surfaces room updates stranded on this device — either waiting for a
 * connection, or blocked because the room changed elsewhere first. Shared by
 * the front-desk and housekeeping boards, which both write through the queue.
 */
export function RoomSyncBanner({
  summary,
  onRetry,
  className = "mt-6",
}: {
  summary: { pending: number; conflicts: number };
  onRetry: () => Promise<{ synced: number; conflicts: number }>;
  className?: string;
}) {
  if (!summary.pending && !summary.conflicts) return null;

  return (
    <section
      className={`border p-4 ${className} ${
        summary.conflicts
          ? "border-status-dirty/70 bg-status-dirty/10"
          : "border-amber/50 bg-amber/10"
      }`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="signage text-cream">
            {summary.pending
              ? `${summary.pending} room update${plural(summary.pending)} waiting to sync`
              : "Room update needs review"}
          </p>
          <p className="mt-1 text-sm text-cream/70">
            {summary.conflicts
              ? `${summary.conflicts} update${plural(summary.conflicts)} conflict with a newer room change. Refresh the room before trying again.`
              : "Changes are stored on this device and will retry when a connection is available."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-cream/35 bg-transparent text-cream hover:bg-cream/10"
          onClick={() => {
            void onRetry().then(({ synced, conflicts }) => {
              if (synced) toast.success(`${synced} room update${plural(synced)} synced.`);
              else if (conflicts) toast.error("A room changed elsewhere and needs review.");
              else toast.message("Updates are still waiting for a connection.");
            });
          }}
        >
          Retry sync
        </Button>
      </div>
    </section>
  );
}

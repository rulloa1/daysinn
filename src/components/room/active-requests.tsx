import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { clockTime, STATUS_CONFIG, type GuestRequestRow } from "./content";

/** The guest's own open requests, polled from the guest-scoped server function. */
export function ActiveRequests({ rows, loading }: { rows: GuestRequestRow[]; loading: boolean }) {
  return (
    <section className="glass-card flex flex-col justify-between rounded-3xl p-6 md:p-7">
      <div>
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <h2 className="font-serif text-lg font-bold text-foreground">Your Active Requests</h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {rows.length} {rows.length === 1 ? "request" : "requests"}
          </span>
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Checking request status…</p>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-foreground">No active room requests</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a service above to send towels, housekeeping, or report an issue.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((row) => {
              const status = STATUS_CONFIG[row.status] ?? {
                label: row.status,
                class: "bg-muted text-muted-foreground border-border",
                icon: HelpCircle,
              };
              const StatusIcon = status.icon;

              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-background/60 p-4 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-serif text-sm font-bold text-foreground">{row.type}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.class}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                  {row.details ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">{row.details}</p>
                  ) : null}
                  <p className="text-[10px] text-muted-foreground">
                    Requested at {clockTime(row.created_at)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 border-t border-border/70 pt-4 text-center">
        <Link
          to="/track"
          className="text-xs font-bold text-primary underline-offset-4 hover:underline"
        >
          Open full live tracker timeline →
        </Link>
      </div>
    </section>
  );
}

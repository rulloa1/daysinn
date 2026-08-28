import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpsAssistant } from "@/components/ops-assistant";
import { RequestWorkflowPanel } from "@/components/request-workflow-panel";
import { timeAgo, type StaffIdentity } from "@/lib/ops";
import { NEXT_ACTION, STATUS_ACCENT, STATUS_LABEL, STATUSES, type RequestRow } from "./types";

function statusBadgeClass(status: string) {
  if (status === "new") return "bg-amber text-ink";
  if (status === "in_progress") return "bg-sage text-ink";
  return "bg-cream/15 text-cream";
}

function QueueRow({
  row,
  canTriage,
  staff,
  onSetStatus,
}: {
  row: RequestRow;
  canTriage: boolean;
  staff: StaffIdentity;
  onSetStatus: (id: string, status: string) => void;
}) {
  const next = NEXT_ACTION[row.status];
  const others = STATUSES.filter((status) => status !== row.status && status !== next?.status);

  return (
    <li
      className={`group relative border border-cream/15 bg-cream/[0.04] p-4 pl-6 transition-colors duration-200 hover:border-amber/60 ${row.status === "done" ? "opacity-70" : ""}`}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-full w-[3px] ${STATUS_ACCENT[row.status]}`}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-2xl tabular-nums">{row.room}</span>
            <span className="text-base text-cream">{row.type}</span>
            <Badge className={statusBadgeClass(row.status)}>
              {STATUS_LABEL[row.status] ?? row.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-cream/50">
            {row.guest_name ? `${row.guest_name} · ` : ""}
            <span title={new Date(row.created_at).toLocaleString()}>{timeAgo(row.created_at)}</span>
          </p>
          {row.details ? (
            <p className="mt-2 max-w-2xl text-sm text-cream/85">{row.details}</p>
          ) : null}
        </div>
        {canTriage ? (
          <div className="flex flex-wrap items-center gap-2">
            {next ? (
              <Button
                size="sm"
                className="bg-amber text-ink hover:bg-amber/90"
                onClick={() => onSetStatus(row.id, next.status)}
              >
                {next.label}
              </Button>
            ) : null}
            {others.map((status) => (
              <Button
                key={status}
                size="sm"
                variant="outline"
                className="border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                onClick={() => onSetStatus(row.id, status)}
              >
                {STATUS_LABEL[status]}
              </Button>
            ))}
          </div>
        ) : (
          <p className="signage text-cream/40">View only</p>
        )}
      </div>
      <RequestWorkflowPanel request={row} canEdit={canTriage} staff={staff} />
    </li>
  );
}

/** The live guest-request queue: counters, filter, and the triage list. */
export function RequestQueue({
  visible,
  counts,
  filter,
  onFilterChange,
  canTriage,
  staff,
  onSetStatus,
}: {
  visible: RequestRow[];
  counts: Record<string, number>;
  filter: string;
  onFilterChange: (next: string) => void;
  canTriage: boolean;
  staff: StaffIdentity;
  onSetStatus: (id: string, status: string) => void;
}) {
  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {STATUSES.map((status) => {
          const on = filter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onFilterChange(on ? "all" : status)}
              aria-pressed={on}
              className={`group flex items-center justify-between border p-4 text-left transition-colors duration-200 ${
                on
                  ? "border-amber/70 bg-cream/[0.07]"
                  : "border-cream/15 bg-cream/[0.04] hover:border-cream/35"
              }`}
            >
              <p className="signage flex items-center gap-2 text-cream/60">
                <span aria-hidden className={`h-3 w-[3px] ${STATUS_ACCENT[status]}`} />
                {STATUS_LABEL[status]}
              </p>
              <p className="font-display text-3xl leading-none tabular-nums">{counts[status]}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-cream/10 pb-4">
        <span className="signage mr-1 text-cream/40">Filter</span>
        {["all", ...STATUSES].map((option) => (
          <Button
            key={option}
            size="sm"
            variant="outline"
            className={
              filter === option
                ? "border-amber bg-amber text-ink hover:bg-amber/90"
                : "border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
            }
            onClick={() => onFilterChange(option)}
          >
            {option === "all" ? "All" : STATUS_LABEL[option]}
          </Button>
        ))}
        <span className="ml-auto text-xs text-cream/40">{visible.length} shown</span>
      </div>

      <OpsAssistant />

      {visible.length === 0 ? (
        <div className="mt-10 border border-dashed border-cream/20 bg-cream/[0.02] p-10 text-center">
          <p className="font-display text-2xl">Queue is clear</p>
          <p className="mt-2 text-sm text-cream/60">New guest requests land here automatically.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {visible.map((row) => (
            <QueueRow
              key={row.id}
              row={row}
              canTriage={canTriage}
              staff={staff}
              onSetStatus={onSetStatus}
            />
          ))}
        </ul>
      )}
    </>
  );
}

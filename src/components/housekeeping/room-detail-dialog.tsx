import { Ban, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequestWorkflowPanel } from "@/components/request-workflow-panel";
import { REQUEST_STATUS_LABEL } from "@/lib/request-workflow";
import { timeAgo, type StaffIdentity } from "@/lib/ops";
import {
  buildingForRoom,
  DB_STATUS_DOT,
  DB_STATUS_LABEL,
  DB_STATUS_TEXT,
  isDndActive,
  isExtendedStay,
  type DbRoomStatus,
} from "@/lib/room-model";
import { CLEANING_STAGES, QUICK_STATUS, type IssueRow, type RoomRow } from "./types";

/** Full detail and controls for one room, opened from the grid or the map. */
export function RoomDetailDialog({
  room,
  issues,
  staff,
  canTriage,
  onClose,
  onSetStatus,
  onSetStage,
  onToggleLinen,
  onSetAssignment,
  onReportIssue,
}: {
  room: RoomRow | null;
  issues: IssueRow[];
  staff: NonNullable<StaffIdentity>;
  canTriage: boolean;
  onClose: () => void;
  onSetStatus: (room: RoomRow, next: DbRoomStatus) => void;
  onSetStage: (room: RoomRow, stage: string | null) => void;
  onToggleLinen: (room: RoomRow) => void;
  onSetAssignment: (room: RoomRow, toMe: boolean) => void;
  onReportIssue: (room: RoomRow) => void;
}) {
  const mineOrFree = room ? !room.assigned_staff_id || room.assigned_staff_id === staff.id : false;
  const roomIssues = room ? issues.filter((i) => i.room === room.number) : [];

  return (
    <Dialog open={!!room} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-cream/20 bg-ink text-cream">
        {room ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="font-display text-3xl">Room {room.number}</DialogTitle>
                <span className="signage rounded border border-cream/20 bg-cream/[0.04] px-2 py-0.5 text-xs text-cream/70">
                  {buildingForRoom(room.number)} · Floor {room.floor}
                </span>
              </div>
              <DialogDescription className="text-cream/60">
                Updated {timeAgo(room.updated_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2">
              <p className={`signage ${DB_STATUS_TEXT[room.status]}`}>
                <span
                  aria-hidden
                  className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${DB_STATUS_DOT[room.status]}`}
                />
                {DB_STATUS_LABEL[room.status]}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {isDndActive(room) ? (
                <div className="flex items-center gap-2 rounded-lg border border-status-dnd/60 bg-status-dnd/20 p-2.5 text-white">
                  <Ban className="h-4 w-4 shrink-0 text-status-dnd" />
                  <span className="text-xs font-semibold">
                    Do Not Disturb set — do not knock or enter.
                  </span>
                </div>
              ) : null}
              {isExtendedStay(room) ? (
                <div className="flex items-center gap-2 rounded-lg border border-amber/60 bg-amber/15 p-2.5 text-amber">
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold">
                    Extended Stay · Checkout extended to {room.check_out || "a later date"}.
                  </span>
                </div>
              ) : null}
            </div>

            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="signage text-cream/45">Guest</dt>
                <dd className="mt-1 font-medium text-cream/85">{room.guest_name || "—"}</dd>
              </div>
              <div>
                <dt className="signage text-cream/45">Checkout Date</dt>
                <dd className="mt-1 text-cream/85">
                  {room.check_out || "—"}
                  {room.original_check_out && room.original_check_out !== room.check_out ? (
                    <span className="ml-2 text-xs text-cream/50">
                      (originally {room.original_check_out})
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="signage text-cream/45">Front desk notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-cream/85">
                  {room.notes || "No notes."}
                </dd>
              </div>
            </dl>

            <div className="rounded-lg border border-cream/15 bg-cream/[0.03] p-3">
              <p className="signage text-cream/45">Assigned to</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm text-cream/85">{room.assigned_name ?? "Unassigned"}</p>
                {mineOrFree ? (
                  <button
                    type="button"
                    disabled={!canTriage}
                    onClick={() => onSetAssignment(room, room.assigned_staff_id !== staff.id)}
                    className="signage border border-cream/25 px-3 py-2 text-cream/70 transition-colors duration-200 hover:text-amber disabled:opacity-40"
                  >
                    {room.assigned_staff_id === staff.id ? "Release" : "Assign to me"}
                  </button>
                ) : null}
              </div>
            </div>

            {roomIssues.length ? (
              <div>
                <p className="signage text-amber">Open issues</p>
                <ul className="mt-2 space-y-3">
                  {roomIssues.map((issue) => (
                    <li
                      key={issue.id}
                      className="rounded border border-cream/15 bg-cream/[0.03] px-3 py-2"
                    >
                      <p className="text-sm text-cream">
                        {issue.type} · {REQUEST_STATUS_LABEL[issue.status] ?? issue.status}
                      </p>
                      {issue.details ? (
                        <p className="mt-1 text-xs text-cream/65">{issue.details}</p>
                      ) : null}
                      <RequestWorkflowPanel request={issue} canEdit={canTriage} staff={staff} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {mineOrFree ? (
              <div>
                <p className="signage text-cream/45">Update cleaning state</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {QUICK_STATUS.map((option) => (
                    <Button
                      key={option.status}
                      disabled={!canTriage || room.status === option.status}
                      onClick={() => {
                        onSetStatus(room, option.status);
                        // A room marked clean is done — get out of the way.
                        if (option.status === "vacant_clean") onClose();
                      }}
                      className={`h-12 text-base hover:opacity-90 ${option.className}`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <p className="signage mt-4 text-cream/45">Stage</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {CLEANING_STAGES.map((stage) => (
                    <Button
                      key={stage.label}
                      variant="outline"
                      disabled={!canTriage || (room.hk_stage ?? null) === stage.value}
                      onClick={() => onSetStage(room, stage.value)}
                      className="h-11 border-cream/25 bg-transparent text-xs text-cream hover:bg-cream/10 hover:text-cream"
                    >
                      {stage.label}
                    </Button>
                  ))}
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-cream/75">
                  <input
                    type="checkbox"
                    disabled={!canTriage}
                    checked={Boolean(room.linen_change)}
                    onChange={() => onToggleLinen(room)}
                  />
                  Linen change needed
                </label>
              </div>
            ) : (
              <p className="text-xs text-cream/45">
                Read-only — this room belongs to {room.assigned_name}.
              </p>
            )}

            <Button
              variant="outline"
              onClick={() => onReportIssue(room)}
              className="h-12 w-full border-amber/60 bg-transparent text-base text-amber hover:bg-amber/10 hover:text-amber"
            >
              Report an issue
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

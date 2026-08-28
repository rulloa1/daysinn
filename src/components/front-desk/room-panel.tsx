import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequestWorkflowPanel } from "@/components/request-workflow-panel";
import { GuestChatPanel } from "@/components/guest-chat-panel";
import { REQUEST_STATUS_LABEL } from "@/lib/request-workflow";
import { timeAgo, type RoomStatusEvent, type StaffIdentity } from "@/lib/ops";
import {
  DB_STATUS_CARD,
  DB_STATUS_DOT,
  DB_STATUS_LABEL,
  DB_STATUS_ORDER,
  toGuestStatus,
} from "@/lib/room-model";
import { GUEST_STATUSES, PRIORITY_LEVELS } from "@/types/operations";
import { RoomHistory } from "./room-history";
import { RoomKeyPanel } from "./room-key-panel";
import type { RequestRow, RoomPatch, RoomRow } from "./types";

const CLEANING_STAGES: { value: string | null; label: string }[] = [
  { value: null, label: "None" },
  { value: "in_progress", label: "In progress" },
  { value: "inspected", label: "Inspected" },
];

const TOGGLE_CLASS = (on: boolean) =>
  `signage border px-3 py-2 text-[11px] disabled:opacity-45 ${
    on ? "border-amber text-amber" : "border-cream/20 text-cream/60"
  }`;

/** Everything the desk can change about one room, in a single dialog. */
export function RoomPanel({
  room,
  canEdit,
  requests,
  history,
  staff,
  onClose,
  onSave,
  onQr,
}: {
  room: RoomRow | null;
  canEdit: boolean;
  requests: RequestRow[];
  history: RoomStatusEvent[];
  staff: StaffIdentity;
  onClose: () => void;
  onSave: (room: RoomRow, patch: RoomPatch) => Promise<void>;
  onQr: (room: RoomRow) => void;
}) {
  const [guest, setGuest] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGuest(room?.guest_name ?? "");
    setNotes(room?.notes ?? "");
  }, [room?.id, room?.guest_name, room?.notes]);

  return (
    <Dialog open={!!room} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-cream/20 bg-ink text-cream sm:max-w-md">
        {room ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl">Room {room.number}</DialogTitle>
              <DialogDescription className="text-cream/60">
                {room.bed_type} · Floor {room.floor} · updated {timeAgo(room.updated_at)}
              </DialogDescription>
            </DialogHeader>

            {!staff ? (
              <p className="border border-amber/45 bg-amber/10 px-3 py-2 text-xs text-cream/75">
                Pick who is on the desk at the top of the board so changes are attributed to you.
              </p>
            ) : null}

            <div>
              <p className="signage text-cream/55">Status</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {DB_STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => void onSave(room, { status })}
                    className={`border px-3 py-2 text-left text-xs transition-colors duration-200 disabled:opacity-45 ${DB_STATUS_CARD[status]} ${room.status === status ? "ring-2 ring-amber" : ""}`}
                  >
                    <span
                      aria-hidden
                      className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${DB_STATUS_DOT[status]}`}
                    />
                    {DB_STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="signage text-cream/55">Guest status</p>
                <select
                  value={room.guest_status ?? toGuestStatus({ ...room, status: room.status })}
                  disabled={!canEdit}
                  onChange={(e) => void onSave(room, { guest_status: e.target.value })}
                  className="mt-2 h-10 w-full border border-cream/20 bg-ink px-3 text-sm text-cream disabled:opacity-45"
                >
                  {GUEST_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="signage text-cream/55">Priority</p>
                <div className="mt-2 flex gap-2">
                  {PRIORITY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => void onSave(room, { priority: level })}
                      className={TOGGLE_CLASS((room.priority ?? "Normal") === level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="signage text-cream/55">Cleaning stage</p>
                <div className="mt-2 flex gap-2">
                  {CLEANING_STAGES.map((stage) => (
                    <button
                      key={stage.label}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => void onSave(room, { hk_stage: stage.value })}
                      className={TOGGLE_CLASS((room.hk_stage ?? null) === stage.value)}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-cream/75">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={Boolean(room.linen_change)}
                  onChange={(e) => void onSave(room, { linen_change: e.target.checked })}
                />
                Linen change needed
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <p className="signage text-cream/55">Guest name</p>
                <Input
                  value={guest}
                  disabled={!canEdit}
                  onChange={(e) => setGuest(e.target.value)}
                  placeholder="Unassigned"
                  className="mt-2 border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
                />
              </div>
              <div>
                <p className="signage text-cream/55">Notes</p>
                <Textarea
                  value={notes}
                  disabled={!canEdit}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="AC repaired, late checkout requested…"
                  className="mt-2 min-h-20 border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
                />
              </div>
            </div>

            {requests.length ? (
              <div>
                <p className="signage text-amber">Open guest requests</p>
                <ul className="mt-2 space-y-3 text-sm text-cream/75">
                  {requests.map((req) => (
                    <li key={req.id} className="border border-cream/15 bg-cream/[0.03] px-3 py-2">
                      <p className="text-cream">
                        {req.type} · {REQUEST_STATUS_LABEL[req.status] ?? req.status}
                      </p>
                      {req.details ? (
                        <p className="mt-1 text-xs text-cream/65">{req.details}</p>
                      ) : null}
                      <RequestWorkflowPanel request={req} canEdit={canEdit} staff={staff} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <RoomKeyPanel room={room.number} canEdit={canEdit} />

            <div>
              <p className="signage text-amber">Guest chat</p>
              <div className="mt-2">
                <GuestChatPanel
                  room={room.number}
                  canEdit={canEdit}
                  staffName={staff?.name ?? null}
                />
              </div>
            </div>

            <RoomHistory history={history} />

            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-amber text-ink hover:bg-amber/90"
                disabled={!canEdit || saving}
                onClick={async () => {
                  setSaving(true);
                  await onSave(room, {
                    guest_name: guest.trim() || null,
                    notes: notes.trim() || null,
                  });
                  setSaving(false);
                  onClose();
                }}
              >
                Save changes
              </Button>
              <Button
                variant="outline"
                className="border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                onClick={() => onQr(room)}
              >
                Guest QR
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

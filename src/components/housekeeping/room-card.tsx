import { Ban, RefreshCw, Sparkles } from "lucide-react";
import { timeAgo } from "@/lib/ops";
import {
  DB_STATUS_CARD_STRONG,
  DB_STATUS_DOT,
  DB_STATUS_LABEL,
  DB_STATUS_PILL,
  HK_STAGE_LABEL,
  isDndActive,
  isExtendedStay,
} from "@/lib/room-model";
import type { RoomRow } from "./types";

/**
 * One room on the housekeeping grid. Sized and spaced for a thumb on a phone:
 * the primary action is a full-width 44px target and the whole card is tappable
 * to open details.
 */
export function RoomCard({
  room,
  isMine,
  canTriage,
  onOpen,
  onMarkClean,
  onToggleAssignment,
}: {
  room: RoomRow;
  isMine: boolean;
  canTriage: boolean;
  onOpen: (id: string) => void;
  onMarkClean: (room: RoomRow) => void;
  onToggleAssignment: (room: RoomRow, toMe: boolean) => void;
}) {
  // Unassigned rooms are fair game; someone else's room is read-only.
  const actionable = !room.assigned_staff_id || isMine;
  const needsTurn = room.status === "vacant_dirty";
  const stage = room.hk_stage ? (HK_STAGE_LABEL[room.hk_stage] ?? room.hk_stage) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(room.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(room.id);
        }
      }}
      className={`group relative flex h-full min-h-[10.5rem] cursor-pointer touch-manipulation select-none flex-col overflow-hidden rounded-xl border p-3.5 pl-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cream/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber active:scale-[0.99] ${DB_STATUS_CARD_STRONG[room.status]}`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-[4px] ${DB_STATUS_DOT[room.status]}`}
      />
      <span className="flex items-start justify-between gap-2">
        <div>
          <span className="font-display text-3xl leading-none tracking-tight text-cream">
            {room.number}
          </span>
          <span className="mt-1 block text-[0.65rem] text-cream/50">Floor {room.floor}</span>
        </div>
        <span
          className={`signage rounded-full border px-2 py-1 text-right text-[0.55rem] font-semibold leading-none ${DB_STATUS_PILL[room.status]}`}
        >
          {DB_STATUS_LABEL[room.status]}
        </span>
      </span>

      <span className="mt-2.5 flex min-h-[1.5rem] flex-wrap items-center gap-1.5">
        {isDndActive(room) ? (
          <span
            className="signage flex items-center gap-1 rounded bg-status-dnd px-2 py-0.5 text-[0.62rem] font-bold text-white shadow-sm"
            title="Do Not Disturb set — do not knock"
          >
            <Ban className="h-3 w-3 shrink-0" />
            <span>DND</span>
          </span>
        ) : null}
        {isExtendedStay(room) ? (
          <span
            className="signage flex items-center gap-1 rounded bg-amber px-2 py-0.5 text-[0.62rem] font-bold text-ink shadow-sm"
            title="Extended Stay: Checkout date pushed later"
          >
            <RefreshCw className="h-3 w-3 shrink-0" />
            <span>Extended Stay</span>
          </span>
        ) : null}
        {stage ? (
          <span className="signage rounded border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[0.6rem] text-sky-100">
            {stage}
          </span>
        ) : null}
        {room.linen_change ? (
          <span className="signage rounded border border-amber/50 bg-amber/10 px-1.5 py-0.5 text-[0.6rem] text-amber">
            Linens
          </span>
        ) : null}
      </span>

      <span className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-cream/55">
          {room.assigned_name
            ? isMine
              ? "Assigned to you"
              : `Assigned to ${room.assigned_name}`
            : "Unassigned"}
        </span>
        <span className="shrink-0 text-cream/35">{timeAgo(room.updated_at)}</span>
      </span>

      <span className="mt-auto block pt-3">
        {actionable && needsTurn ? (
          <button
            type="button"
            disabled={!canTriage}
            onClick={(e) => {
              e.stopPropagation();
              onMarkClean(room);
            }}
            className="signage flex min-h-11 w-full touch-manipulation items-center justify-center gap-1.5 rounded-lg bg-status-clean px-3 py-2 text-center text-[0.72rem] font-bold text-ink shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mark clean</span>
          </button>
        ) : null}
        <span
          className={`grid gap-1.5 ${actionable && needsTurn ? "mt-1.5 grid-cols-2" : "grid-cols-1"}`}
        >
          {actionable ? (
            <button
              type="button"
              disabled={!canTriage}
              onClick={(e) => {
                e.stopPropagation();
                onToggleAssignment(room, !isMine);
              }}
              className={`signage flex min-h-11 touch-manipulation items-center justify-center rounded-md border px-2 py-2 text-center text-[0.62rem] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isMine
                  ? "border-cream/25 text-cream/60 hover:bg-cream/10 hover:text-cream"
                  : "border-amber/60 text-amber hover:bg-amber hover:text-ink"
              }`}
            >
              {isMine ? "Release" : "Claim"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(room.id);
            }}
            className="signage flex min-h-11 touch-manipulation items-center justify-center rounded-md border border-cream/20 px-2 py-2 text-center text-[0.62rem] text-cream/65 transition-colors hover:border-cream/45 hover:bg-cream/10 hover:text-cream"
          >
            {actionable ? "Details & status" : "View details"}
          </button>
        </span>
      </span>
    </div>
  );
}

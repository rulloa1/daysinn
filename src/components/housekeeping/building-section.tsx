import {
  DB_STATUS_DOT,
  DB_STATUS_LABEL,
  DB_STATUS_ORDER,
  type DbRoomStatus,
} from "@/lib/room-model";
import type { BuildingName } from "@/types/operations";
import { RoomCard } from "./room-card";
import type { RoomRow } from "./types";

/** One building's rooms, under a sticky header summarising its status mix. */
export function BuildingSection({
  building,
  description,
  rooms,
  staffId,
  canTriage,
  onOpen,
  onMarkClean,
  onToggleAssignment,
}: {
  building: BuildingName;
  description: string;
  rooms: RoomRow[];
  staffId: string | null;
  canTriage: boolean;
  onOpen: (id: string) => void;
  onMarkClean: (room: RoomRow) => void;
  onToggleAssignment: (room: RoomRow, toMe: boolean) => void;
}) {
  const dirtyCount = rooms.filter((r) => r.status === "vacant_dirty").length;
  const statusCounts = DB_STATUS_ORDER.map(
    (status) => [status, rooms.filter((r) => r.status === status).length] as const,
  ).filter(([, n]) => n > 0);

  return (
    <section className="mt-8">
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-cream/10 bg-ink/90 px-1 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-4 w-[3px] shrink-0 bg-amber" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="signage text-base font-medium text-cream">{building}</h2>
              <span className="signage rounded border border-cream/15 bg-cream/[0.04] px-2 py-0.5 text-[0.65rem] text-cream/60">
                {rooms.length} rooms
              </span>
              {dirtyCount > 0 ? (
                <span className="signage rounded border border-status-dirty/40 bg-status-dirty/20 px-2 py-0.5 text-[0.65rem] font-bold text-status-dirty">
                  {dirtyCount} to turn
                </span>
              ) : (
                <span className="signage rounded border border-status-clean/40 bg-status-clean/20 px-2 py-0.5 text-[0.65rem] text-status-clean">
                  All clean
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[0.7rem] text-cream/45">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusCounts.map(([status, n]) => (
            <StatusChip key={status} status={status} count={n} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isMine={room.assigned_staff_id === staffId}
            canTriage={canTriage}
            onOpen={onOpen}
            onMarkClean={onMarkClean}
            onToggleAssignment={onToggleAssignment}
          />
        ))}
      </div>
    </section>
  );
}

function StatusChip({ status, count }: { status: DbRoomStatus; count: number }) {
  return (
    <span className="signage flex shrink-0 items-center gap-1.5 rounded-full border border-cream/10 bg-cream/[0.03] px-2 py-0.5 text-[0.6rem] text-cream/60">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DB_STATUS_DOT[status]}`} />
      {DB_STATUS_LABEL[status]} {count}
    </span>
  );
}

import { useMemo } from "react";
import {
  DB_STATUS_CARD,
  DB_STATUS_DOT,
  DB_STATUS_LABEL,
  DB_STATUS_TEXT,
  HK_STAGE_LABEL,
  PRIORITY_BADGE,
  toGuestStatus,
  wingForRoom,
} from "@/lib/room-model";
import type { PriorityLevel } from "@/types/operations";
import type { RoomRow } from "./types";

function RoomCard({
  room,
  openRequests,
  onSelect,
}: {
  room: RoomRow;
  openRequests: number;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      className={`border p-3 text-left transition-colors duration-200 ${DB_STATUS_CARD[room.status]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xl leading-none">{room.number}</span>
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${DB_STATUS_DOT[room.status]}`} />
      </div>
      <p className={`signage mt-2 ${DB_STATUS_TEXT[room.status]}`}>
        {DB_STATUS_LABEL[room.status]}
      </p>
      <p className="mt-1 truncate text-xs text-cream/70">{room.guest_name ?? room.bed_type}</p>
      <p className="mt-1 truncate text-[11px] text-cream/45">
        {room.wing ?? wingForRoom(room.number)} · {toGuestStatus({ ...room, status: room.status })}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {room.priority && room.priority !== "Normal" ? (
          <span
            className={`signage px-1.5 py-0.5 text-[10px] ${PRIORITY_BADGE[room.priority as PriorityLevel]}`}
          >
            {room.priority}
          </span>
        ) : null}
        {room.linen_change ? (
          <span className="signage bg-cream/12 px-1.5 py-0.5 text-[10px] text-cream/75">Linen</span>
        ) : null}
        {room.hk_stage ? (
          <span className="signage bg-amber/20 px-1.5 py-0.5 text-[10px] text-amber">
            {HK_STAGE_LABEL[room.hk_stage] ?? room.hk_stage}
          </span>
        ) : null}
      </div>
      {openRequests ? (
        <p className="signage mt-1 text-amber">
          {openRequests} request{openRequests === 1 ? "" : "s"}
        </p>
      ) : null}
    </button>
  );
}

/** The room-list view: every visible room, grouped by floor. */
export function RoomList({
  rooms,
  openCountByRoom,
  onSelect,
}: {
  rooms: RoomRow[];
  openCountByRoom: Map<string, number>;
  onSelect: (id: string) => void;
}) {
  const byFloor = useMemo(() => {
    const map = new Map<number, RoomRow[]>();
    for (const room of rooms) {
      const list = map.get(room.floor) ?? [];
      list.push(room);
      map.set(room.floor, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [rooms]);

  if (byFloor.length === 0) {
    return <p className="text-sm text-cream/50">No rooms match this filter.</p>;
  }

  return (
    <>
      {byFloor.map(([floor, list]) => (
        <div key={floor} className="mb-8">
          <p className="signage text-cream/50">
            Floor {floor} · {list.length} rooms
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {list.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                openRequests={openCountByRoom.get(room.number) ?? 0}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  type DbRoomStatus,
  DB_STATUS_LABEL,
  HK_STAGE_LABEL,
  PRIORITY_BADGE,
  wingForRoom,
} from "@/lib/room-model";
import { timeAgo } from "@/lib/ops";
import type { PriorityLevel } from "@/types/operations";
import type { BookingRow, RoomRow } from "./types";

interface RoomBoardTableProps {
  rooms: RoomRow[];
  arrivals: BookingRow[];
  openCountByRoom: Map<string, number>;
  onSelectRoom: (id: string) => void;
  onSelectMap?: () => void;
}

const STATUS_CONFIG: Record<
  DbRoomStatus,
  { label: string; solid: string; tint: string; key: string }
> = {
  clean: { label: "Ready", solid: "#0F7B4F", tint: "#E7F4EE", key: "clean" },
  dirty: { label: "To turn", solid: "#B45309", tint: "#FBF0E2", key: "dirty" },
  occupied: { label: "In house", solid: "#0065AB", tint: "#E5F0F9", key: "occupied" },
  occupied_dnd: { label: "Do not disturb", solid: "#7C3AED", tint: "#F1EAFC", key: "dnd" },
  reserved: { label: "Arriving", solid: "#0E7490", tint: "#E4F2F5", key: "reserved" },
  out_of_order: { label: "Blocked", solid: "#B91C1C", tint: "#FBEAE9", key: "ooo" },
};

export function RoomBoardTable({
  rooms,
  arrivals,
  openCountByRoom,
  onSelectRoom,
  onSelectMap,
}: RoomBoardTableProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Map arrivals by room number
  const arrivalsByRoom = useMemo(() => {
    const map = new Map<string, BookingRow>();
    for (const arr of arrivals) {
      map.set(arr.room, arr);
    }
    return map;
  }, [arrivals]);

  // Sort by urgency:
  // 1. Arriving today & not clean
  // 2. Open maintenance or high priority requests
  // 3. Dirty / to turn
  // 4. Occupied
  // 5. DND
  // 6. Clean / ready
  // 7. Out of order
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const aArr = arrivalsByRoom.has(a.number);
      const bArr = arrivalsByRoom.has(b.number);
      const aReq = openCountByRoom.get(a.number) ?? 0;
      const bReq = openCountByRoom.get(b.number) ?? 0;

      // Urgency priority weight
      const getWeight = (r: RoomRow, hasArr: boolean, reqCount: number) => {
        if (hasArr && r.status !== "clean") return 1; // High urgency: arrival unready
        if (reqCount > 0) return 2; // Open guest requests
        if (r.status === "dirty") return 3; // Needs turn
        if (r.status === "reserved") return 4;
        if (r.status === "occupied") return 5;
        if (r.status === "occupied_dnd") return 6;
        if (r.status === "clean") return 7;
        return 8; // out_of_order
      };

      const wA = getWeight(a, aArr, aReq);
      const wB = getWeight(b, bArr, bReq);

      if (wA !== wB) return wA - wB;
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [rooms, arrivalsByRoom, openCountByRoom]);

  // Status counts for legend
  const legendCounts = useMemo(() => {
    const ready = rooms.filter((r) => r.status === "clean").length;
    const toTurn = rooms.filter((r) => r.status === "dirty").length;
    const inHouse = rooms.filter((r) => r.status === "occupied" || r.status === "occupied_dnd").length;
    const arriving = arrivals.length;
    const blocked = rooms.filter((r) => r.status === "out_of_order").length;

    return [
      { label: "Ready", color: "#0F7B4F", count: ready },
      { label: "To turn", color: "#B45309", count: toTurn },
      { label: "In house", color: "#0065AB", count: inHouse },
      { label: "Arriving", color: "#0E7490", count: arriving },
      { label: "Blocked", color: "#B91C1C", count: blocked },
    ];
  }, [rooms, arrivals]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 md:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-[11px] font-bold tracking-widest text-[#004986] uppercase">
            Room board · {rooms.length} rooms
          </p>

          {/* Segmented Control */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                viewMode === "list"
                  ? "bg-white text-[#004986] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                viewMode === "grid"
                  ? "bg-white text-[#004986] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Grid
            </button>
            {onSelectMap ? (
              <button
                type="button"
                onClick={onSelectMap}
                className="rounded-md px-3 py-1 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
              >
                Map
              </button>
            ) : (
              <Link
                to="/live-room-status"
                className="inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
              >
                Map
              </Link>
            )}
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold text-slate-600">
          {legendCounts.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              {item.label}{" "}
              <span className="font-mono text-slate-800">{item.count}</span>
            </span>
          ))}
        </div>
      </div>

      {viewMode === "list" ? (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                <th className="px-5 py-3">Room</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Guest</th>
                <th className="px-3 py-3">Housekeeper</th>
                <th className="px-3 py-3">Wing</th>
                <th className="px-5 py-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedRooms.map((room) => {
                const arrival = arrivalsByRoom.get(room.number);
                const hasArrivalRisk = arrival && room.status !== "clean";
                const isUrgent =
                  hasArrivalRisk || (openCountByRoom.get(room.number) ?? 0) > 0;
                const statusInfo = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.clean;

                const displayStatus = arrival
                  ? `Arriving ${arrival.check_in === "today" ? "" : "4 PM"}`
                  : statusInfo.label;

                return (
                  <tr
                    key={room.id}
                    onClick={() => onSelectRoom(room.id)}
                    className={`cursor-pointer transition hover:bg-slate-50/80 ${
                      isUrgent ? "bg-[#FDFBF4]" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-base font-bold text-[#004986]">
                      {room.number}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: statusInfo.tint,
                          color: statusInfo.solid,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: statusInfo.solid }}
                          aria-hidden="true"
                        />
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-medium text-slate-700">
                      {room.guest_name ||
                        (arrival ? arrival.guest_name : "Available")}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {room.hk_stage ? (
                        <span className="font-semibold text-slate-700">
                          {HK_STAGE_LABEL[room.hk_stage] ?? room.hk_stage}
                        </span>
                      ) : (
                        "Unassigned"
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-400">
                      {room.wing ?? wingForRoom(room.number)} · Floor {room.floor}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-slate-400">
                      {room.updated_at ? timeAgo(room.updated_at) : "Today"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Showing {sortedRooms.length} rooms · sorted by urgency
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {sortedRooms.map((room) => {
              const statusInfo = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.clean;
              const reqs = openCountByRoom.get(room.number) ?? 0;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelectRoom(room.id)}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-[#004986] hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-[#004986]">
                      {room.number}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: statusInfo.solid }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-2">
                    <span
                      className="inline-block rounded-md px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor: statusInfo.tint,
                        color: statusInfo.solid,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                    <p className="mt-1.5 truncate text-xs text-slate-600">
                      {room.guest_name ?? room.bed_type}
                    </p>
                  </div>
                  {reqs > 0 ? (
                    <p className="mt-2 text-[10px] font-bold text-amber-600">
                      {reqs} open request{reqs > 1 ? "s" : ""}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

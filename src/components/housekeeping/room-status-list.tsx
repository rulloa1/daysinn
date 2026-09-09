import React, { useState, useMemo } from "react";
import { Search, Eye } from "lucide-react";
import { STATUS_COLORS, type PropertyRoomData, type RoomStatusType } from "./property-aerial-types";
import { cn } from "@/lib/utils";

interface RoomStatusListProps {
  rooms: Record<string, PropertyRoomData>;
  selectedRoom: string | null;
  selectedFilter: string;
  onSelectRoom: (roomNumber: string) => void;
  onViewAll?: () => void;
}

export function RoomStatusList({
  rooms,
  selectedRoom,
  selectedFilter,
  onSelectRoom,
  onViewAll,
}: RoomStatusListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoomList = useMemo(() => {
    const list = Object.values(rooms);
    return list.filter((r) => {
      const matchSearch = r.number.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchFilter =
        selectedFilter === "All" || r.status.toLowerCase() === selectedFilter.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [rooms, searchQuery, selectedFilter]);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-full max-h-[640px] w-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3">
          ROOM STATUS
        </h3>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room number..."
            className="w-full pl-3.5 pr-9 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00244e]/20 focus:border-[#00244e] transition"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
        <span className="col-span-3">ROOM</span>
        <span className="col-span-6 text-center">STATUS</span>
        <span className="col-span-3 text-right">FLOOR</span>
      </div>

      {/* Table Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 min-h-[300px]">
        {filteredRoomList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-medium">
            No rooms found matching filters
          </div>
        ) : (
          filteredRoomList.map((room) => {
            const isSelected = selectedRoom === room.number;
            const colors = STATUS_COLORS[room.status] || STATUS_COLORS.Clean;

            return (
              <div
                key={room.number}
                onClick={() => onSelectRoom(room.number)}
                className={cn(
                  "grid grid-cols-12 items-center px-4 py-2.5 cursor-pointer transition-colors text-xs font-medium",
                  isSelected
                    ? "bg-blue-50/80 font-bold border-l-4 border-l-[#00244e]"
                    : "hover:bg-slate-50/80 text-slate-700",
                )}
              >
                {/* Room # */}
                <span className="col-span-3 font-bold text-slate-900">{room.number}</span>

                {/* Status Badge */}
                <div className="col-span-6 flex justify-center">
                  <span
                    className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight text-center shadow-2xs border"
                    style={{
                      backgroundColor: colors.pillBg,
                      color: colors.pillText,
                      borderColor: colors.border + "40",
                    }}
                  >
                    {room.status}
                  </span>
                </div>

                {/* Floor */}
                <span className="col-span-3 text-right text-slate-500">{room.floor}</span>
              </div>
            );
          })
        )}
      </div>

      {/* View All Rooms Footer Link */}
      <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition hover:underline inline-flex items-center gap-1.5"
        >
          <span>View All Rooms</span>
        </button>
      </div>
    </div>
  );
}

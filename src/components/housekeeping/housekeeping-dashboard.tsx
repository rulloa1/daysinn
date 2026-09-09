import React, { useState, useMemo, useCallback } from "react";
import { HousekeepingSidebar } from "./housekeeping-sidebar";
import {
  HousekeepingDashboardHeader,
  HousekeepingDashboardFooter,
} from "./housekeeping-dashboard-header";
import { StatusFilterLegend } from "./status-filter-legend";
import { PropertyAerialMap } from "./property-aerial-map";
import { type PropertyRoomData, type RoomStatusType } from "./property-aerial-types";
import { RoomStatusList } from "./room-status-list";
import { RoomActionDialog } from "./room-action-dialog";
import { toast } from "sonner";

// Initial rooms matching the exact mockup dataset
const INITIAL_ROOMS: Record<string, PropertyRoomData> = {
  // 2nd Floor Vertical Wing
  "201": {
    number: "201",
    status: "Clean",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Maria Santos",
  },
  "202": {
    number: "202",
    status: "Dirty",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Elena Rostova",
  },
  "203": {
    number: "203",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Maria Santos",
  },
  "204": {
    number: "204",
    status: "Inspected",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Sofia Perez",
  },
  "205": {
    number: "205",
    status: "Dirty",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Elena Rostova",
  },
  "206": {
    number: "206",
    status: "Clean",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Maria Santos",
  },
  "207": {
    number: "207",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Carmen Diaz",
  },
  "208": {
    number: "208",
    status: "Out of Order",
    floor: "2nd",
    type: "2 Queen Beds",
    notes: "AC repair pending",
  },
  "209": {
    number: "209",
    status: "Clean",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Carmen Diaz",
  },
  "210": {
    number: "210",
    status: "Dirty",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Elena Rostova",
  },
  "211": {
    number: "211",
    status: "Occupied",
    floor: "2nd",
    type: "1 King Bed",
    guestName: "Taylor J.",
  },
  "213": {
    number: "213",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Carmen Diaz",
  },
  "215": {
    number: "215",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Carmen Diaz",
  },
  "217": {
    number: "217",
    status: "Dirty",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Elena Rostova",
  },
  "219": {
    number: "219",
    status: "Inspected",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Sofia Perez",
  },
  "221": {
    number: "221",
    status: "Clean",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Maria Santos",
  },
  "223": {
    number: "223",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Maria Santos",
  },
  "225": {
    number: "225",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Angela Wright",
  },
  "227": {
    number: "227",
    status: "Clean",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Angela Wright",
  },
  "229": {
    number: "229",
    status: "Dirty",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Elena Rostova",
  },
  "231": {
    number: "231",
    status: "Clean",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Angela Wright",
  },
  "233": {
    number: "233",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Angela Wright",
  },
  "235": {
    number: "235",
    status: "Inspected",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Sofia Perez",
  },

  // 2nd Floor Horizontal Wing
  "236": {
    number: "236",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Carmen Diaz",
  },
  "238": {
    number: "238",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Carmen Diaz",
  },
  "240": {
    number: "240",
    status: "Occupied",
    floor: "2nd",
    type: "1 King Bed",
    guestName: "Michael B.",
  },
  "242": {
    number: "242",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Maria Santos",
  },
  "244": {
    number: "244",
    status: "Clean",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Maria Santos",
  },
  "246": {
    number: "246",
    status: "Inspected",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Sofia Perez",
  },
  "248": {
    number: "248",
    status: "Clean",
    floor: "2nd",
    type: "1 King Bed",
    housekeeper: "Angela Wright",
  },
  "250": {
    number: "250",
    status: "Dirty",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Elena Rostova",
  },
  "252": {
    number: "252",
    status: "Clean",
    floor: "2nd",
    type: "2 Queen Beds",
    housekeeper: "Angela Wright",
  },
  "254": {
    number: "254",
    status: "Out of Order",
    floor: "2nd",
    type: "1 King Bed",
    notes: "Bathroom plumbing check",
  },

  // 1st Floor Rooms (Completing 66 total rooms)
  "101": { number: "101", status: "Clean", floor: "1st", type: "1 King Bed" },
  "102": { number: "102", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "103": { number: "103", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "104": { number: "104", status: "Dirty", floor: "1st", type: "1 King Bed" },
  "105": { number: "105", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "106": { number: "106", status: "Clean", floor: "1st", type: "1 King Bed" },
  "107": { number: "107", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "108": { number: "108", status: "Dirty", floor: "1st", type: "2 Queen Beds" },
  "109": { number: "109", status: "Clean", floor: "1st", type: "1 King Bed" },
  "110": { number: "110", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "111": { number: "111", status: "Dirty", floor: "1st", type: "1 King Bed" },
  "112": { number: "112", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "113": { number: "113", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "114": { number: "114", status: "Clean", floor: "1st", type: "1 King Bed" },
  "115": { number: "115", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "116": { number: "116", status: "Dirty", floor: "1st", type: "1 King Bed" },
  "117": { number: "117", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "118": { number: "118", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "119": { number: "119", status: "Inspected", floor: "1st", type: "1 King Bed" },
  "120": { number: "120", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "121": { number: "121", status: "Clean", floor: "1st", type: "1 King Bed" },
  "122": { number: "122", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "123": { number: "123", status: "Dirty", floor: "1st", type: "2 Queen Beds" },
  "124": { number: "124", status: "Clean", floor: "1st", type: "1 King Bed" },
  "125": { number: "125", status: "Dirty", floor: "1st", type: "2 Queen Beds" },
  "126": { number: "126", status: "Clean", floor: "1st", type: "1 King Bed" },
  "127": { number: "127", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "128": { number: "128", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "129": { number: "129", status: "Dirty", floor: "1st", type: "1 King Bed" },
  "130": { number: "130", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "131": { number: "131", status: "Clean", floor: "1st", type: "1 King Bed" },
  "132": { number: "132", status: "Clean", floor: "1st", type: "2 Queen Beds" },
  "133": { number: "133", status: "Inspected", floor: "1st", type: "2 Queen Beds" },
};

export function HousekeepingDashboardView({
  embedded = true,
}: {
  embedded?: boolean;
} = {}) {
  const [rooms, setRooms] = useState<Record<string, PropertyRoomData>>(INITIAL_ROOMS);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("dashboard");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate live statistics
  const stats = useMemo(() => {
    const list = Object.values(rooms);
    const total = list.length;
    let clean = 0;
    let dirty = 0;
    let inspected = 0;
    let ooo = 0;
    let occupied = 0;
    let vacant = 0;

    list.forEach((r) => {
      if (r.status === "Clean") clean++;
      else if (r.status === "Dirty") dirty++;
      else if (r.status === "Inspected") inspected++;
      else if (r.status === "Out of Order") ooo++;
      else if (r.status === "Occupied") occupied++;
      else if (r.status === "Vacant") vacant++;
    });

    return {
      total,
      clean,
      dirty,
      inspected,
      ooo,
      occupied,
      vacant,
      counts: {
        Clean: clean,
        Dirty: dirty,
        Inspected: inspected,
        "Out of Order": ooo,
        Occupied: occupied,
        Vacant: vacant,
      } as Record<RoomStatusType, number>,
    };
  }, [rooms]);

  const handleSelectRoom = useCallback((roomNumber: string) => {
    setSelectedRoomNumber(roomNumber);
    setActionDialogOpen(true);
  }, []);

  const handleUpdateStatus = (
    roomNumber: string,
    status: RoomStatusType,
    housekeeper?: string,
    notes?: string,
  ) => {
    setRooms((prev) => {
      const current = prev[roomNumber] ?? {
        number: roomNumber,
        status: "Clean",
        floor: "2nd",
        type: "Standard Room",
      };
      return {
        ...prev,
        [roomNumber]: {
          ...current,
          status,
          ...(housekeeper !== undefined ? { housekeeper } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      };
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard data refreshed");
    }, 600);
  };

  const selectedRoomData = selectedRoomNumber ? (rooms[selectedRoomNumber] ?? null) : null;

  return (
    <div
      className={
        embedded
          ? "flex flex-col w-full bg-[#eef2f7] min-h-[700px]"
          : "flex h-screen w-screen overflow-hidden bg-[#eef2f7]"
      }
    >
      {/* 1. LEFT NAVIGATION SIDEBAR (Only in standalone mode) */}
      {!embedded && (
        <HousekeepingSidebar
          activeTab={activeNavTab}
          onTabSelect={(tab) => {
            setActiveNavTab(tab);
            if (tab !== "dashboard") {
              toast.info(`Switched view to ${tab}`);
            }
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Header & Stat Summary */}
        <HousekeepingDashboardHeader
          totalRooms={stats.total}
          cleanCount={stats.clean}
          dirtyCount={stats.dirty}
          inspectedCount={stats.inspected}
          outOfOrderCount={stats.ooo}
          onAddAssignment={() => {
            toast.success("Assignment workflow opened");
          }}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* 3-COLUMN MAIN DASHBOARD GRID */}
        <main className="flex-1 px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          {/* Left Panel: Status Filter & Legend (3 cols) */}
          <section className="lg:col-span-3 flex flex-col gap-4">
            <StatusFilterLegend
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              statusCounts={stats.counts}
            />
          </section>

          {/* Center Panel: Property Overview Site Plan (6 cols) */}
          <section className="lg:col-span-6 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                PROPERTY OVERVIEW
              </h3>
            </div>
            <PropertyAerialMap
              rooms={rooms}
              selectedFilter={selectedFilter}
              selectedRoom={selectedRoomNumber}
              onSelectRoom={handleSelectRoom}
            />
          </section>

          {/* Right Panel: Room Status Table (3 cols) */}
          <section className="lg:col-span-3 flex flex-col gap-4">
            <RoomStatusList
              rooms={rooms}
              selectedRoom={selectedRoomNumber}
              selectedFilter={selectedFilter}
              onSelectRoom={handleSelectRoom}
              onViewAll={() => {
                setSelectedFilter("All");
                toast.info("Showing all 66 property rooms");
              }}
            />
          </section>
        </main>

        {/* BOTTOM METRIC BAR */}
        <HousekeepingDashboardFooter
          housekeepersOnDuty={6}
          roomsAssigned={24}
          roomsPending={stats.dirty}
          inspectionPending={stats.inspected}
          lastUpdated="2 mins ago"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Room Action Modal */}
      <RoomActionDialog
        room={selectedRoomData}
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}

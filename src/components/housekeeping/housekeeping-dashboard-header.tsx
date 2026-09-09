import React from "react";
import {
  Calendar,
  ChevronDown,
  Bell,
  Menu,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderStatsProps {
  totalRooms: number;
  cleanCount: number;
  dirtyCount: number;
  inspectedCount: number;
  outOfOrderCount: number;
  onAddAssignment?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function HousekeepingDashboardHeader({
  totalRooms,
  cleanCount,
  dirtyCount,
  inspectedCount,
  outOfOrderCount,
  onAddAssignment,
  onRefresh,
  isRefreshing,
}: HeaderStatsProps) {
  const cleanPct = Math.round((cleanCount / (totalRooms || 1)) * 100);
  const dirtyPct = Math.round((dirtyCount / (totalRooms || 1)) * 100);
  const inspectedPct = Math.round((inspectedCount / (totalRooms || 1)) * 100);
  const oooPct = Math.round((outOfOrderCount / (totalRooms || 1)) * 100);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. TOP NAV BAR */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#001738] text-white border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <button className="p-1 text-slate-300 hover:text-white transition rounded-md hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white">Housekeeping Dashboard</h1>
        </div>

        <div className="flex items-center gap-6">
          {/* Date Selector Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer text-xs font-medium text-slate-200 transition">
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span>May 14, 2025</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Clock */}
          <div className="text-xs font-semibold tracking-wide text-slate-200">10:24 AM</div>

          {/* Notification Bell with Badge */}
          <div className="relative cursor-pointer p-1 text-slate-300 hover:text-white transition">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              3
            </span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/15">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-[#001738] font-bold text-xs flex items-center justify-center shadow-xs">
              HK
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold leading-none text-white">Housekeeping</span>
              <span className="text-[10px] text-slate-300 leading-tight">Supervisor</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. PROPERTY SUMMARY BANNER & STATS CARD */}
      <div className="px-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
          {/* Property Name & Rating */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Days Inn by Wyndham Valdosta I-75
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-700">3.5 (874)</span>
              <span>|</span>
              <span>1-star hotel</span>
            </div>
          </div>

          {/* KPI Stat Cards & Add Assignment Button */}
          <div className="flex flex-wrap items-center gap-3 md:gap-5 w-full xl:w-auto">
            {/* Total Rooms */}
            <div className="flex flex-col items-center justify-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/70 min-w-[80px]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Rooms
              </span>
              <span className="text-xl font-extrabold text-blue-700">{totalRooms}</span>
            </div>

            {/* Clean */}
            <div className="flex items-baseline gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/70 min-w-[90px]">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Clean
                </span>
                <span className="text-xl font-extrabold text-[#16a34a]">{cleanCount}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">{cleanPct}%</span>
            </div>

            {/* Dirty */}
            <div className="flex items-baseline gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/70 min-w-[90px]">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Dirty
                </span>
                <span className="text-xl font-extrabold text-[#dc2626]">{dirtyCount}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">{dirtyPct}%</span>
            </div>

            {/* Inspected */}
            <div className="flex items-baseline gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/70 min-w-[90px]">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Inspected
                </span>
                <span className="text-xl font-extrabold text-[#2563eb]">{inspectedCount}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">{inspectedPct}%</span>
            </div>

            {/* Out of Order */}
            <div className="flex items-baseline gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/70 min-w-[90px]">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Out of Order
                </span>
                <span className="text-xl font-extrabold text-slate-700">{outOfOrderCount}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">{oooPct}%</span>
            </div>

            {/* + Add Assignment Button */}
            <Button
              onClick={onAddAssignment}
              className="bg-[#00244e] hover:bg-[#001738] text-white font-bold text-xs px-4 py-5 rounded-xl shadow-sm transition hover:shadow flex items-center gap-1.5 ml-auto xl:ml-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Assignment</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HousekeepingDashboardFooter({
  housekeepersOnDuty = 6,
  roomsAssigned = 24,
  roomsPending = 16,
  inspectionPending = 6,
  lastUpdated = "2 mins ago",
  onRefresh,
  isRefreshing = false,
}: {
  housekeepersOnDuty?: number;
  roomsAssigned?: number;
  roomsPending?: number;
  inspectionPending?: number;
  lastUpdated?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <footer className="mt-4 px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Housekeepers On Duty</span>
          <span className="font-bold text-slate-900">{housekeepersOnDuty}</span>
        </div>

        <div className="h-3 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Rooms Assigned</span>
          <span className="font-bold text-blue-700">{roomsAssigned}</span>
        </div>

        <div className="h-3 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Rooms Pending</span>
          <span className="font-bold text-red-600">{roomsPending}</span>
        </div>

        <div className="h-3 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Inspection Pending</span>
          <span className="font-bold text-indigo-600">{inspectionPending}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500 ml-auto">
        <span>Last Updated: {lastUpdated}</span>
        <button
          onClick={onRefresh}
          className="p-1 hover:text-slate-900 transition rounded hover:bg-slate-100"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </footer>
  );
}

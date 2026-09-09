import React from "react";
import { STATUS_COLORS, type RoomStatusType } from "./property-aerial-types";
import { cn } from "@/lib/utils";

interface StatusFilterLegendProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  statusCounts: Record<RoomStatusType, number>;
}

export function StatusFilterLegend({
  selectedFilter,
  onFilterChange,
  statusCounts,
}: StatusFilterLegendProps) {
  const filterOptions = [
    { key: "All", label: "All" },
    { key: "Clean", label: "Clean", pillClass: "bg-[#e8fbe8] text-[#15803d] border-[#bbf7d0]" },
    { key: "Dirty", label: "Dirty", pillClass: "bg-[#fee2e2] text-[#dc2626] border-[#fecaca]" },
    {
      key: "Inspected",
      label: "Inspected",
      pillClass: "bg-[#e0e7ff] text-[#2563eb] border-[#c7d2fe]",
    },
    {
      key: "Out of Order",
      label: "Out of Order",
      pillClass: "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]",
    },
    {
      key: "Occupied",
      label: "Occupied",
      pillClass: "bg-[#fef9c3] text-[#ca8a04] border-[#fef08a]",
    },
    { key: "Vacant", label: "Vacant", pillClass: "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]" },
  ];

  return (
    <div className="flex flex-col gap-6 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm w-full">
      {/* STATUS FILTER SECTION */}
      <div>
        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3.5">
          STATUS FILTER
        </h3>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => {
            const isSelected = selectedFilter === opt.key;
            if (opt.key === "All") {
              return (
                <button
                  key={opt.key}
                  onClick={() => onFilterChange(opt.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm",
                    isSelected
                      ? "bg-[#00244e] text-white shadow-blue-950/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
                  )}
                >
                  All
                </button>
              );
            }

            return (
              <button
                key={opt.key}
                onClick={() => onFilterChange(isSelected ? "All" : opt.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  opt.pillClass,
                  isSelected
                    ? "ring-2 ring-[#00244e] ring-offset-1 font-bold scale-[1.03]"
                    : "hover:opacity-90 opacity-95",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {selectedFilter !== "All" && (
          <button
            onClick={() => onFilterChange("All")}
            className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 transition hover:underline block"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* LEGEND SECTION */}
      <div>
        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3.5">LEGEND</h3>

        <div className="flex flex-col gap-2.5">
          {(
            [
              { key: "Clean", label: "Clean", bg: "#a3e635" },
              { key: "Dirty", label: "Dirty", bg: "#f87171" },
              { key: "Inspected", label: "Inspected", bg: "#93c5fd" },
              { key: "Out of Order", label: "Out of Order", bg: "#cbd5e1" },
              { key: "Occupied", label: "Occupied", bg: "#fde047" },
              { key: "Vacant", label: "Vacant", bg: "#e2e8f0" },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-[3px] border border-black/10 shrink-0 shadow-xs"
                style={{ backgroundColor: item.bg }}
              />
              <span className="text-xs font-medium text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Amenity Icons Legend */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
          {/* Stairs */}
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded bg-[#1e40af] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg
                viewBox="0 0 24 24"
                className="w-3 h-3 stroke-white fill-none stroke-[2.5] stroke-linecap-round stroke-linejoin-round"
              >
                <path d="M4 19h4v-4h4v-4h4v-4h4" />
              </svg>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              STAIRS
            </span>
          </div>

          {/* Elevator */}
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded bg-[#1e40af] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                <path d="M12 4l-4 5h8l-4-5zm0 16l4-5H8l4 5z" />
              </svg>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              ELEVATOR
            </span>
          </div>

          {/* Ice / Vending */}
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded bg-[#1e40af] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-white stroke-2">
                <circle cx="12" cy="7" r="3" fill="#ffffff" />
                <rect x="7" y="13" width="10" height="7" rx="1" fill="#93c5fd" />
              </svg>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              ICE / VENDING
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

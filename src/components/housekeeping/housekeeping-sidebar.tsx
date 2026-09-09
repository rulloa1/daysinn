import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  DoorClosed,
  UserCheck,
  ClipboardList,
  Wrench,
  BarChart2,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab?: string;
  onTabSelect?: (tabId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function HousekeepingSidebar({
  activeTab = "dashboard",
  onTabSelect,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/housekeeping" },
    { id: "rooms", label: "Rooms", icon: DoorClosed, to: "/live-room-status" },
    { id: "housekeeping", label: "Housekeeping", icon: UserCheck, to: "/housekeeping" },
    { id: "assignments", label: "Assignments", icon: ClipboardList, to: "/staff" },
    { id: "maintenance", label: "Maintenance", icon: Wrench, to: "/staff" },
    { id: "reports", label: "Reports", icon: BarChart2, to: "/staff" },
    { id: "alerts", label: "Alerts", icon: Bell, to: "/staff", badge: 3 },
    { id: "settings", label: "Settings", icon: Settings, to: "/roles" },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#001738] text-white border-r border-white/10 shrink-0 transition-all duration-300 z-30 select-none min-h-screen",
        collapsed ? "w-16" : "w-56",
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-center min-h-[70px]">
        {collapsed ? (
          <img
            src={logoAsset.url}
            alt="Days Inn"
            className="h-7 w-auto object-contain brightness-110 drop-shadow"
          />
        ) : (
          <div className="flex flex-col items-center">
            <img
              src={logoAsset.url}
              alt="Days Inn"
              className="h-9 w-auto object-contain brightness-110 drop-shadow"
            />
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabSelect && onTabSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative group",
                isActive
                  ? "bg-[#003875] text-white shadow-sm font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white",
                )}
              />

              {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}

              {item.badge && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none shrink-0",
                    collapsed ? "absolute top-1 right-1" : "",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

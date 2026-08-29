import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  ListFilter,
  Map as MapIcon,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardTab } from "./types";

type TabSpec = {
  id: DashboardTab;
  label: string;
  icon: typeof ListFilter;
  /** Restricted tabs sit behind a divider at the end of the strip. */
  dividerBefore?: boolean;
};

function tabs(openCount: number, roomCount: number): TabSpec[] {
  return [
    { id: "queue", label: `Request queue (${openCount})`, icon: ListFilter },
    { id: "map", label: `Property map (${roomCount})`, icon: MapIcon },
    { id: "crm", label: "Guest CRM", icon: Users },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "schedules", label: "Schedules", icon: Calendar, dividerBefore: true },
    { id: "assignments", label: "Assignments", icon: ClipboardCheck },
    { id: "team", label: "Team & Invites", icon: UserPlus },
  ];
}

export function DashboardTabs({
  active,
  onSelect,
  canViewTab,
  openCount,
  roomCount,
}: {
  active: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
  /** Role check from the shared screen-access policy. */
  canViewTab: (tab: DashboardTab) => boolean;
  openCount: number;
  roomCount: number;
}) {
  const visible = tabs(openCount, roomCount).filter((tab) => canViewTab(tab.id));

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <div className="flex min-w-max items-center gap-2 border-b border-slate-200 pb-3">
        {visible.map((tab) => {
          const Icon = tab.icon;
          const on = active === tab.id;
          return (
            <div key={tab.id} className="flex items-center gap-2">
              {tab.dividerBefore ? (
                <div className="mx-1 hidden h-5 w-px bg-slate-300 sm:block" />
              ) : null}
              <Button
                type="button"
                variant={on ? "default" : "outline"}
                onClick={() => onSelect(tab.id)}
                className={`min-h-10 rounded-xl px-3.5 text-xs font-bold transition sm:min-h-9 ${
                  on
                    ? "bg-[#004986] text-white shadow-sm hover:bg-[#004986]/90"
                    : "border-slate-300 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {tab.label}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

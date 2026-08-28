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
  /** Manager-only tabs sit behind a divider at the end of the strip. */
  managerOnly?: boolean;
  dividerBefore?: boolean;
};

function tabs(openCount: number, roomCount: number): TabSpec[] {
  return [
    { id: "queue", label: `Request queue (${openCount})`, icon: ListFilter },
    { id: "map", label: `Property map (${roomCount})`, icon: MapIcon },
    { id: "crm", label: "Guest CRM", icon: Users },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "analytics", label: "Analytics", icon: BarChart3, managerOnly: true },
    {
      id: "schedules",
      label: "Schedules",
      icon: Calendar,
      managerOnly: true,
      dividerBefore: true,
    },
    { id: "assignments", label: "Assignments", icon: ClipboardCheck, managerOnly: true },
    { id: "team", label: "Team & Invites", icon: UserPlus, managerOnly: true },
  ];
}

export function DashboardTabs({
  active,
  onSelect,
  isManager,
  openCount,
  roomCount,
}: {
  active: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
  isManager: boolean;
  openCount: number;
  roomCount: number;
}) {
  const visible = tabs(openCount, roomCount).filter((tab) => isManager || !tab.managerOnly);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <div className="flex min-w-max items-center gap-2 border-b border-cream/15 pb-4">
        {visible.map((tab) => {
          const Icon = tab.icon;
          const on = active === tab.id;
          return (
            <div key={tab.id} className="flex items-center gap-2">
              {tab.dividerBefore ? (
                <div className="mx-1 hidden h-6 w-px bg-cream/15 sm:block" />
              ) : null}
              <Button
                type="button"
                variant={on ? "default" : "outline"}
                onClick={() => onSelect(tab.id)}
                className={`min-h-11 sm:min-h-9 ${
                  on
                    ? "bg-amber font-bold text-ink hover:bg-amber/90"
                    : "border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                }`}
              >
                <Icon className="mr-1.5 h-4 w-4" />
                {tab.label}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

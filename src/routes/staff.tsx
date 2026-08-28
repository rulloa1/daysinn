import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SystemStatus } from "@/components/system-status";
import { Button } from "@/components/ui/button";
import { TeamPanel } from "@/components/team-panel";
import { InvitePanel } from "@/components/invite-panel";
import { AssignmentBoard } from "@/components/assignment-board";
import { ScheduleBoard } from "@/components/schedule-board";
import { PasswordResetGate } from "@/components/password-reset-gate";
import { GuestCrmPanel } from "@/components/guest-crm-panel";
import { useStaffRole } from "@/hooks/use-staff-role";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { claimFirstManager } from "@/lib/roles.functions";
import { MaintenanceTicketsPanel } from "@/components/maintenance-tickets-panel";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { FloorPlan, type FloorView } from "@/components/floor-plan";
import { DashboardHeader } from "@/components/staff/dashboard-header";
import { DashboardTabs } from "@/components/staff/dashboard-tabs";
import { RequestQueue } from "@/components/staff/request-queue";
import { RoomInspector } from "@/components/staff/room-inspector";
import { SignIn } from "@/components/staff/sign-in";
import { useRequestQueue } from "@/components/staff/use-request-queue";
import { NavRail } from "@/components/front-desk/nav-rail";
import type { DashboardTab } from "@/components/staff/types";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Request Queue & Staff Portal — Days Inn Hub" },
      {
        name: "description",
        content:
          "Front-desk dashboard for routing guest requests: triage new asks, mark them in progress, and close them out.",
      },
      { property: "og:title", content: "Request Queue — Days Inn Hub" },
      {
        property: "og:description",
        content: "Triage and close out guest requests from one live queue.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EEF2F7] text-sm text-slate-500">
        Loading Staff Portal…
      </div>
    );
  }

  if (!session) return <SignIn />;

  return (
    <PasswordResetGate>
      <Dashboard session={session} />
    </PasswordResetGate>
  );
}

function Dashboard({ session }: { session: Session }) {
  const role = useStaffRole();
  const { isManager, canTriage, loading: roleLoading, refresh } = role;
  const canEditCrm = isManager || role.roles.includes("staff");
  const { staff } = useStaffIdentity();

  const [activeTab, setActiveTab] = useState<DashboardTab>("queue");
  const [mapFloor, setMapFloor] = useState<FloorView>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const queue = useRequestQueue(canTriage, staff ?? null);
  const claimManager = useServerFn(claimFirstManager);

  const selectedRoom = useMemo(
    () => (selectedRoomId ? (queue.rooms.find((r) => r.id === selectedRoomId) ?? null) : null),
    [selectedRoomId, queue.rooms],
  );

  async function claim() {
    setClaiming(true);
    try {
      const { claimed } = await claimManager({ data: undefined });
      if (claimed) {
        toast.success("You're now the manager.");
        await refresh();
      } else {
        toast.error("A manager already exists — ask them for access.");
      }
    } catch {
      toast.error("Couldn't complete setup.");
    }
    setClaiming(false);
  }

  return (
    <div className="flex min-h-screen bg-[#EEF2F7] text-slate-800">
      {/* Navigation Rail */}
      <NavRail current="queue" staff={staff} />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <DashboardHeader isManager={isManager} />

          <PwaInstallPrompt className="mt-1" />

          {!roleLoading && !canTriage ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-50/50 p-5">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-[#B45309] uppercase">
                  View-only access
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  You can watch the queue, but a manager must grant you staff access before you can
                  triage requests.
                </p>
              </div>
              <Button
                size="sm"
                disabled={claiming}
                className="bg-[#004986] text-white hover:bg-[#004986]/90"
                onClick={claim}
              >
                {claiming ? "Setting up…" : "I'm the first manager"}
              </Button>
            </div>
          ) : null}

          {/* Top Sub-tabs */}
          <DashboardTabs
            active={activeTab}
            onSelect={setActiveTab}
            isManager={isManager}
            openCount={queue.openCount}
            roomCount={queue.rooms.length}
          />

          {/* Tab Views */}
          {activeTab === "queue" ? (
            <RequestQueue
              visible={queue.visible}
              counts={queue.counts}
              filter={queue.filter}
              onFilterChange={queue.setFilter}
              canTriage={canTriage}
              staff={staff ?? null}
              onSetStatus={queue.setStatus}
            />
          ) : activeTab === "map" ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FloorPlan
                floor={mapFloor}
                rooms={queue.rooms}
                openRequests={queue.openRequestsByRoom}
                onFloorChange={setMapFloor}
                onSelect={(roomId) => setSelectedRoomId(roomId)}
              />
              <RoomInspector
                room={selectedRoom}
                requests={queue.requestsForRoom(selectedRoom?.number)}
                onClose={() => setSelectedRoomId(null)}
              />
            </div>
          ) : activeTab === "crm" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <GuestCrmPanel canEdit={canEditCrm} />
            </div>
          ) : activeTab === "maintenance" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <MaintenanceTicketsPanel
                reporter={staff?.name ?? "Staff"}
                reporterStaffId={staff?.id ?? null}
              />
            </div>
          ) : activeTab === "analytics" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <AnalyticsDashboard />
            </div>
          ) : activeTab === "schedules" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ScheduleBoard />
            </div>
          ) : activeTab === "assignments" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <AssignmentBoard />
            </div>
          ) : activeTab === "team" ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <TeamPanel />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <InvitePanel />
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

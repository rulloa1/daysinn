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
import type { DashboardTab } from "@/components/staff/types";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Dashboard — Days Inn Hub" },
      {
        name: "description",
        content:
          "Front-desk dashboard for routing guest requests: triage new asks, mark them in progress, and close them out.",
      },
      { property: "og:title", content: "Staff Dashboard — Days Inn Hub" },
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
      <div className="ops-surface flex min-h-screen items-center justify-center bg-ink text-sm text-cream/60">
        Loading…
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
    <div className="ops-surface min-h-screen bg-ink pb-16 text-cream">
      <div className="px-6 md:px-12">
        <DashboardHeader isManager={isManager} />

        <PwaInstallPrompt className="mt-4" />

        <div className="mt-4 flex justify-end">
          <SystemStatus session={session} />
        </div>

        {!roleLoading && !canTriage ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-amber/50 bg-amber/10 p-5">
            <div>
              <p className="signage text-amber">View-only access</p>
              <p className="mt-2 text-sm text-cream/70">
                You can watch the queue, but a manager must grant you staff access before you can
                triage requests.
              </p>
            </div>
            <Button
              size="sm"
              disabled={claiming}
              className="bg-amber text-ink hover:bg-amber/90"
              onClick={claim}
            >
              {claiming ? "Setting up…" : "I'm the first manager"}
            </Button>
          </div>
        ) : null}

        <DashboardTabs
          active={activeTab}
          onSelect={setActiveTab}
          isManager={isManager}
          openCount={queue.openCount}
          roomCount={queue.rooms.length}
        />

        {activeTab === "map" ? (
          <div className="mt-6 space-y-4">
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
          <div className="mt-6">
            <GuestCrmPanel canEdit={canEditCrm} />
          </div>
        ) : activeTab === "maintenance" ? (
          <div className="mt-6">
            <MaintenanceTicketsPanel
              reporter={staff?.name ?? "Staff"}
              reporterStaffId={staff?.id ?? null}
            />
          </div>
        ) : activeTab === "analytics" ? (
          <div className="mt-6">
            <AnalyticsDashboard />
          </div>
        ) : activeTab === "queue" ? (
          <RequestQueue
            visible={queue.visible}
            counts={queue.counts}
            filter={queue.filter}
            onFilterChange={queue.setFilter}
            canTriage={canTriage}
            staff={staff ?? null}
            onSetStatus={queue.setStatus}
          />
        ) : activeTab === "schedules" ? (
          <div className="mt-6">
            <ScheduleBoard />
          </div>
        ) : activeTab === "assignments" ? (
          <div className="mt-6">
            <AssignmentBoard />
          </div>
        ) : activeTab === "team" ? (
          <div className="mt-6 space-y-6">
            <TeamPanel />
            <InvitePanel />
          </div>
        ) : null}
      </div>
    </div>
  );
}

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
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
import { OpsScreenSwitcher } from "@/components/ops/screen-switcher";
import { OpsPageHeading, OpsActionButton } from "@/components/ops/page-heading";
import { NextActionCard, NextActionButton } from "@/components/ops/next-action";
import { OpsStatStrip } from "@/components/ops/stat-strip";

import { DashboardTabs } from "@/components/staff/dashboard-tabs";
import { RequestQueue } from "@/components/staff/request-queue";
import { RoomInspector } from "@/components/staff/room-inspector";
import { StaffNamePicker } from "@/components/staff/name-picker";
import { useRequestQueue } from "@/components/staff/use-request-queue";
import { NavRail } from "@/components/front-desk/nav-rail";
import { StaffErrorBoundary, StaffErrorFallback } from "@/components/staff-error-boundary";
import { ScreenDenied, PanelDenied } from "@/components/ops/screen-guard";
import { canActOnScreen, canViewScreen, type OpsScreenId } from "@/lib/screen-access";
import type { DashboardTab } from "@/components/staff/types";

const TABS = [
  "queue",
  "map",
  "crm",
  "maintenance",
  "analytics",
  "schedules",
  "assignments",
  "team",
] as const;

export const Route = createFileRoute("/staff")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { tab?: DashboardTab } => {
    const tab = search["tab"];
    return typeof tab === "string" && (TABS as readonly string[]).includes(tab)
      ? { tab: tab as DashboardTab }
      : {};
  },

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
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/staff-login" });
  },
  errorComponent: ({ error, reset }) => <StaffErrorFallback error={error} reset={reset} />,
  component: StaffPage,
});

function StaffPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) void navigate({ to: "/staff-login", replace: true });
    });
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setReady(true);
      if (!current) void navigate({ to: "/staff-login", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#a8b7ca] text-sm text-slate-600">
        Loading Staff Portal…
      </div>
    );
  }

  return (
    <PasswordResetGate>
      <Dashboard session={session} />
    </PasswordResetGate>
  );
}

/** Each dashboard tab maps to the screen policy that governs it. */
const TAB_SCREEN: Record<DashboardTab, OpsScreenId> = {
  queue: "queue",
  map: "map",
  crm: "crm",
  maintenance: "maintenance",
  analytics: "analytics",
  schedules: "shifts",
  assignments: "assignments",
  team: "team",
};

function Dashboard({ session }: { session: Session }) {
  const role = useStaffRole();
  const { isManager, roles, loading: roleLoading, refresh } = role;
  const canTriage = canActOnScreen(roles, "queue");
  const canEditCrm = canActOnScreen(roles, "crm");
  const canViewTab = (tab: DashboardTab) => canViewScreen(roles, TAB_SCREEN[tab]);
  const { staff, members, select, error: rosterError } = useStaffIdentity();
  const [pickerSkipped, setPickerSkipped] = useState(false);

  const search = Route.useSearch();
  const [activeTab, setActiveTab] = useState<DashboardTab>(search.tab ?? "queue");
  useEffect(() => {
    if (search.tab) setActiveTab(search.tab);
  }, [search.tab]);

  // A deep link such as ?tab=team must not open for a role without it.
  useEffect(() => {
    if (roleLoading) return;
    if (!canViewScreen(roles, TAB_SCREEN[activeTab])) setActiveTab("queue");
  }, [roleLoading, roles, activeTab]);

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

  // Hooks must run before any early return, or selecting a staff name changes
  // the hook order and tears down the live subscriptions mid-session.
  const roomStats = useMemo(() => {
    const total = queue.rooms.length;
    const dirty = queue.rooms.filter((r) => r.status === "vacant_dirty").length;
    const ready = queue.rooms.filter((r) => r.status === "vacant_clean").length;
    const occupied = queue.rooms.filter(
      (r) => r.status === "occupied" || r.status === "occupied_dnd",
    ).length;
    return { total, dirty, ready, occupied };
  }, [queue.rooms]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    [],
  );

  if (!staff && !pickerSkipped) {
    return (
      <StaffNamePicker
        members={members}
        onSelect={select}
        rosterError={rosterError}
        onSkip={() => setPickerSkipped(true)}
      />
    );
  }

  // Accounts with no operational role (viewers, or invites not yet granted a
  // role) get no queue at all rather than a read-only copy of guest data.
  if (!roleLoading && !canViewScreen(roles, "queue")) {
    return <ScreenDenied screen="queue" suggestion={null} />;
  }




  return (
    <div className="ops-portal flex min-h-screen">
      {/* Navigation Rail */}
      <NavRail current="queue" staff={staff} />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto">
        <OpsScreenSwitcher current={activeTab === "team" ? "team" : "queue"} />
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:px-8 lg:px-10">
          <OpsPageHeading
            eyebrow={`Request queue · ${staff?.name ?? "Front desk"} · ${today}`}
            title="Today at Wildwood I-75"
            actions={
              <>
                <OpsActionButton onClick={() => setActiveTab("queue")} badge={queue.openCount}>
                  Requests
                </OpsActionButton>
                <OpsActionButton variant="primary" onClick={() => setActiveTab("map")}>
                  Property map
                </OpsActionButton>
                {isManager ? (
                  <OpsActionButton onClick={() => setActiveTab("analytics")}>
                    Export metrics
                  </OpsActionButton>
                ) : null}
              </>
            }
          />

          {queue.openCount > 0 ? (
            <NextActionCard
              headline={
                queue.counts.new > 0
                  ? `${queue.counts.new} new guest ${queue.counts.new === 1 ? "request" : "requests"} waiting on triage`
                  : `${queue.counts.in_progress} open ${queue.counts.in_progress === 1 ? "request is" : "requests are"} in progress`
              }
              detail={
                roomStats.dirty > 0
                  ? `${roomStats.dirty} ${roomStats.dirty === 1 ? "room is" : "rooms are"} still vacant dirty while the queue is live. Clear the newest asks first, then push turns to housekeeping.`
                  : "Every room is turned. Work the queue oldest-first so nothing ages past its promise window."
              }
              actions={
                <NextActionButton onClick={() => setActiveTab("queue")}>
                  Open the queue
                </NextActionButton>
              }
              watch={[
                { text: `${queue.counts.new} new`, tone: "amber" },
                { text: `${queue.counts.in_progress} in progress`, tone: "sky" },
                { text: `${roomStats.dirty} vacant dirty`, tone: "rose" },
              ]}
            />
          ) : null}

          <OpsStatStrip
            stats={[
              { label: "Open requests", value: queue.openCount },
              { label: "Rooms", value: roomStats.total },
              { label: "Ready", value: roomStats.ready, trend: "clean", trendTone: "up" },
              { label: "Vacant dirty", value: roomStats.dirty, trend: "to turn", trendTone: "down" },
              { label: "Occupied", value: roomStats.occupied },
            ]}
          />

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
            canViewTab={canViewTab}
            openCount={queue.openCount}
            roomCount={queue.rooms.length}
          />

          {/* Tab Views — the strip already hides these, and this refuses a
              tab reached any other way. */}
          {!canViewTab(activeTab) ? (
            <PanelDenied screen={TAB_SCREEN[activeTab]} />
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
          ) : activeTab === "map" ? (
            <div className="space-y-4 op-card p-6">
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
            <div className="op-card p-6">
              <GuestCrmPanel canEdit={canEditCrm} />
            </div>
          ) : activeTab === "maintenance" ? (
            <div className="op-card p-6">
              <MaintenanceTicketsPanel
                reporter={staff?.name ?? "Staff"}
                reporterStaffId={staff?.id ?? null}
              />
            </div>
          ) : activeTab === "analytics" ? (
            <div className="op-card p-6">
              <AnalyticsDashboard />
            </div>
          ) : activeTab === "schedules" ? (
            <div className="op-card p-6">
              <ScheduleBoard />
            </div>
          ) : activeTab === "assignments" ? (
            <div className="op-card p-6">
              <AssignmentBoard />
            </div>
          ) : activeTab === "team" ? (
            <div className="space-y-6">
              <div className="op-card p-6">
                <StaffErrorBoundary id="staff-team">
                  <TeamPanel />
                </StaffErrorBoundary>
              </div>
              <div className="op-card p-6">
                <StaffErrorBoundary id="staff-invites">
                  <InvitePanel />
                </StaffErrorBoundary>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

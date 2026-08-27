import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { SystemStatus } from "@/components/system-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLockup } from "@/components/brand-lockup";
import { TeamPanel } from "@/components/team-panel";
import { InvitePanel } from "@/components/invite-panel";
import { AssignmentBoard } from "@/components/assignment-board";
import { ScheduleBoard } from "@/components/schedule-board";
import { OpsAssistant } from "@/components/ops-assistant";
import { PasswordResetGate } from "@/components/password-reset-gate";
import { RequestWorkflowPanel } from "@/components/request-workflow-panel";
import { GuestCrmPanel } from "@/components/guest-crm-panel";
import { advanceRequest } from "@/lib/request-workflow";
import { useStaffRole } from "@/hooks/use-staff-role";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { claimFirstManager } from "@/lib/roles.functions";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { FloorPlan, type FloorView, type MapRoom } from "@/components/floor-plan";
import {
  Menu,
  Map as MapIcon,
  ListFilter,
  Users,
  ClipboardCheck,
  FileText,
  Bell,
  Play,
} from "lucide-react";

type RequestRow = {
  id: string;
  room: string;
  guest_name: string | null;
  type: string;
  details: string | null;
  status: string;
  created_at: string;
  started_at?: string | null;
  started_by_name?: string | null;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
};

const STATUSES = ["new", "in_progress", "done"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  done: "Done",
};
const STATUS_ACCENT: Record<string, string> = {
  new: "bg-amber",
  in_progress: "bg-sage",
  done: "bg-cream/25",
};
const NEXT_ACTION: Record<string, { status: string; label: string } | null> = {
  new: { status: "in_progress", label: "Start" },
  in_progress: { status: "done", label: "Complete" },
  done: null,
};

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

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

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("The live data service is not configured. Please contact an administrator.");
      return;
    }
    setBusy(true);
    const credentials = { email: email.trim(), password };
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({
            ...credentials,
            options: { emailRedirectTo: `${window.location.origin}/staff` },
          });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (mode === "signup") toast.success("Check your email to confirm the account.");
  }

  return (
    <main className="ops-surface flex min-h-screen items-center justify-center bg-ink px-6 py-12 text-cream">
      <section className="w-full max-w-md border border-cream/15 bg-cream/[0.04] p-8 shadow-2xl shadow-black/30">
        <BrandLockup tone="cream" />
        <p className="signage mt-8 text-cream/60">Operations portal</p>
        <h1 className="mt-2 text-3xl">Staff sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-cream/60">
          Sign in to access the live room status, housekeeping, and guest-service boards.
        </p>
        {!isSupabaseConfigured ? (
          <p className="mt-4 border border-status-dirty/60 bg-status-dirty/10 p-3 text-sm text-status-dirty">
            The live data service is not configured.
          </p>
        ) : null}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@daysinn.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!isSupabaseConfigured}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!isSupabaseConfigured}
              minLength={6}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={busy || !isSupabaseConfigured}
            className="w-full bg-amber font-bold text-ink hover:bg-amber/90"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        {isSupabaseConfigured ? (
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-sm text-cream/60 underline-offset-4 hover:text-amber hover:underline"
          >
            {mode === "signin"
              ? "Need a staff account? Create one"
              : "Already have an account? Sign in"}
          </button>
        ) : null}
        <Link to="/" className="signage mt-7 inline-block text-cream/50 hover:text-amber">
          ← Guest view
        </Link>
      </section>
    </main>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);

  useEffect(() => {
    if (tourStep === 1) {
      setActiveTab("map");
    } else if (tourStep === 2) {
      setActiveTab("queue");
    } else if (tourStep === 3) {
      setActiveTab("crm");
    }
  }, [tourStep]);

  useEffect(() => {
    if (tourStep === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTourStep(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tourStep]);

  const handleStartTour = () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("daysinn.tour.dismissed", "1");
    }
    setTourStep(1);
  };

  const handleSkipTour = () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("daysinn.tour.dismissed", "1");
    }
  };

  const handleNextStep = () => {
    if (tourStep !== null) {
      if (tourStep < 4) {
        setTourStep(tourStep + 1);
      } else {
        setTourStep(null);
      }
    }
  };

  const handlePrevStep = () => {
    if (tourStep !== null && tourStep > 1) {
      setTourStep(tourStep - 1);
    }
  };

  const [feedbackAnswer, setFeedbackAnswer] = useState<"Yes" | "Maybe" | "No" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const submitFeedback = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!feedbackAnswer) {
      toast.error("Please select an answer.");
      return;
    }
    setFeedbackSubmitted(true);
    toast.success("Thank you for your feedback!");
  };

  const copyFeedback = () => {
    const text = `DaysInn Staff Portal Feedback:
Would this make daily operations easier? ${feedbackAnswer}
Suggestions: ${feedbackText || "None"}`;
    navigator.clipboard.writeText(text);
    toast.success("Feedback copied to clipboard!");
  };

  const emailFeedback = () => {
    const subject = encodeURIComponent("DaysInn staff portal feedback");
    const body = encodeURIComponent(
      `Would this make daily operations easier? ${feedbackAnswer}\nSuggestions: ${feedbackText || "None"}`,
    );
    window.open(`mailto:feedback@daysinn.com?subject=${subject}&body=${body}`, "_blank");
  };
  const [filter, setFilter] = useState<string>("all");
  const role = useStaffRole();
  const roleLoading = role.loading;
  const isManager = role.isManager;
  const canTriage = role.canTriage;
  const canEditCrm = isManager || role.roles.includes("staff");
  const refresh = role.refresh;
  const claimManager = useServerFn(claimFirstManager);
  const [activeTab, setActiveTab] = useState<"queue" | "map" | "crm">("queue");
  const [rooms, setRooms] = useState<MapRoom[]>([]);
  const [mapFloor, setMapFloor] = useState<FloorView>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { staff } = useStaffIdentity();

  useEffect(() => {
    let active = true;
    async function loadRooms() {
      const { data } = await supabase
        .from("rooms")
        .select("id, number, floor, status, guest_name")
        .order("number");
      if (active && data) {
        setRooms(
          data.map((r) => ({
            id: r.id,
            number: r.number,
            status: (r.status ?? "vacant_clean") as MapRoom["status"],
            guest_name: r.guest_name,
          })),
        );
      }
    }
    void loadRooms();
    return () => {
      active = false;
    };
  }, []);

  const openRequestsByRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.status !== "done") {
        map.set(r.room, (map.get(r.room) ?? 0) + 1);
      }
    }
    return map;
  }, [rows]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return rooms.find((r) => r.id === selectedRoomId) ?? null;
  }, [selectedRoomId, rooms]);

  const selectedRoomRequests = useMemo(() => {
    if (!selectedRoom) return [];
    return rows.filter((r) => r.room === selectedRoom.number);
  }, [selectedRoom, rows]);

  useEffect(() => {
    let active = true;
    async function load() {
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string,
        args?: Record<string, unknown>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) => any;
      const { data, error } = await rpc("requests_board")
        .select(
          "id, room, guest_name, type, details, status, created_at, started_at, started_by_name, resolved_at, resolved_by_name",
        )
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        toast.error("Couldn't load the queue.");
        return;
      }
      setRows((data ?? []) as RequestRow[]);
    }
    load();

    const channel = supabase
      .channel("requests-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.status === filter)),
    [rows, filter],
  );

  const counts = useMemo(
    () => ({
      new: rows.filter((row) => row.status === "new").length,
      in_progress: rows.filter((row) => row.status === "in_progress").length,
      done: rows.filter((row) => row.status === "done").length,
    }),
    [rows],
  );

  async function setStatus(id: string, status: string) {
    if (!canTriage) {
      toast.error("You don't have permission to triage requests.");
      return;
    }

    const previous = rows;
    const row = previous.find((r) => r.id === id);
    if (!row) return;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error, updated } = await advanceRequest(row, status, staff ?? null);
    if (error && !updated) {
      setRows(previous);
      toast.error("Update failed — your role may not allow this.");
    } else if (error) {
      toast.warning("Request status updated, but its timeline entry could not be saved.");
    }
  }

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

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="ops-surface min-h-screen bg-ink pb-16 text-cream">
      <div className="px-6 md:px-12">
        <header className="top-0 sticky z-20 -mx-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-cream/15 bg-ink/70 px-6 py-4 backdrop-blur-xl md:-mx-12 md:flex md:flex-wrap md:justify-between md:px-12">
          <div className="flex min-w-0 items-center gap-5">
            <BrandLockup tone="cream" />
            <div className="hidden h-8 w-px bg-cream/15 md:block" />
            <div className="hidden min-w-0 md:block">
              <p className="signage flex items-center gap-2 text-cream/60">
                <span aria-hidden className="h-3 w-[3px] bg-amber" />
                Live shift
              </p>
              <h1 className="mt-1 truncate font-display text-2xl leading-none">Request queue</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <nav className="hidden items-center gap-4 md:flex">
              <Link
                to="/front-desk"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Front desk
              </Link>
              <Link
                to="/housekeeping"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Housekeeping
              </Link>
              {isManager ? (
                <Link
                  to="/roles"
                  className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
                >
                  Roles
                </Link>
              ) : null}
              <Link
                to="/"
                className="signage text-cream/60 transition-colors duration-200 hover:text-amber"
              >
                Guest view
              </Link>
            </nav>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cream/25 text-cream transition-colors duration-200 hover:bg-cream/10 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[80vw] max-w-xs border-cream/15 bg-ink text-cream"
              >
                <SheetHeader>
                  <SheetTitle className="text-left text-cream">Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-3">
                  <Link
                    to="/front-desk"
                    onClick={() => setMenuOpen(false)}
                    className="signage rounded-lg border border-cream/15 px-4 py-3 text-center text-cream/80 transition-colors duration-200 hover:bg-cream/10 hover:text-cream"
                  >
                    Front desk
                  </Link>
                  <Link
                    to="/housekeeping"
                    onClick={() => setMenuOpen(false)}
                    className="signage rounded-lg border border-cream/15 px-4 py-3 text-center text-cream/80 transition-colors duration-200 hover:bg-cream/10 hover:text-cream"
                  >
                    Housekeeping
                  </Link>
                  {isManager ? (
                    <Link
                      to="/roles"
                      onClick={() => setMenuOpen(false)}
                      className="signage rounded-lg border border-cream/15 px-4 py-3 text-center text-cream/80 transition-colors duration-200 hover:bg-cream/10 hover:text-cream"
                    >
                      Roles
                    </Link>
                  ) : null}
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="signage rounded-lg border border-cream/15 px-4 py-3 text-center text-cream/80 transition-colors duration-200 hover:bg-cream/10 hover:text-cream"
                  >
                    Guest view
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <PwaInstallPrompt className="mt-4" />

        {/* System Status in Dashboard */}
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

        {/* Primary Dashboard Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-cream/15 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={activeTab === "queue" ? "default" : "outline"}
              onClick={() => setActiveTab("queue")}
              className={`${
                activeTab === "queue"
                  ? "bg-amber font-bold text-ink hover:bg-amber/90"
                  : "border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
              } ${
                tourStep === 2
                  ? "ring-2 ring-amber ring-offset-2 ring-offset-ink animate-pulse"
                  : ""
              }`}
            >
              <ListFilter className="mr-1.5 h-4 w-4" />
              Request queue ({rows.filter((r) => r.status !== "done").length})
            </Button>

            <Button
              type="button"
              variant={activeTab === "map" ? "default" : "outline"}
              onClick={() => setActiveTab("map")}
              className={`${
                activeTab === "map"
                  ? "bg-amber font-bold text-ink hover:bg-amber/90"
                  : "border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
              } ${
                tourStep === 1
                  ? "ring-2 ring-amber ring-offset-2 ring-offset-ink animate-pulse"
                  : ""
              }`}
            >
              <MapIcon className="mr-1.5 h-4 w-4" />
              Property map ({rooms.length} rooms)
            </Button>

            <Button
              type="button"
              variant={activeTab === "crm" ? "default" : "outline"}
              onClick={() => setActiveTab("crm")}
              className={`${
                activeTab === "crm"
                  ? "bg-amber font-bold text-ink hover:bg-amber/90"
                  : "border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
              } ${
                tourStep === 3
                  ? "ring-2 ring-amber ring-offset-2 ring-offset-ink animate-pulse"
                  : ""
              }`}
            >
              <Users className="mr-1.5 h-4 w-4" />
              Guest CRM
            </Button>
          </div>
        </div>

        {activeTab === "map" ? (
          <div className="mt-6 space-y-4">
            <FloorPlan
              floor={mapFloor}
              rooms={rooms}
              openRequests={openRequestsByRoom}
              onFloorChange={setMapFloor}
              onSelect={(roomId) => setSelectedRoomId(roomId)}
            />

            {/* Room Inspector Sheet */}
            <Sheet
              open={Boolean(selectedRoom)}
              onOpenChange={(open) => !open && setSelectedRoomId(null)}
            >
              <SheetContent
                side="right"
                className="w-[90vw] max-w-md border-cream/15 bg-ink text-cream"
              >
                <SheetHeader>
                  <SheetTitle className="text-left text-cream flex items-center justify-between">
                    <span>Room {selectedRoom?.number}</span>
                    {selectedRoom && (
                      <Badge className="bg-amber text-ink font-mono uppercase text-[10px]">
                        {selectedRoom.status.replace("_", " ")}
                      </Badge>
                    )}
                  </SheetTitle>
                </SheetHeader>

                {selectedRoom && (
                  <div className="mt-6 space-y-6">
                    <div className="rounded-xl border border-cream/15 bg-cream/[0.04] p-4">
                      <p className="text-xs text-cream/50 uppercase tracking-wider">
                        Current Guest
                      </p>
                      <p className="mt-1 font-serif text-lg font-bold text-cream">
                        {selectedRoom.guest_name ?? "No guest registered"}
                      </p>
                    </div>

                    <div>
                      <h3 className="signage text-xs text-cream/60 uppercase tracking-wider mb-2">
                        Open Requests ({selectedRoomRequests.length})
                      </h3>
                      {selectedRoomRequests.length === 0 ? (
                        <p className="text-sm text-cream/40 italic">
                          No open requests for room {selectedRoom.number}.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {selectedRoomRequests.map((req) => (
                            <li
                              key={req.id}
                              className="rounded-lg border border-cream/15 bg-cream/[0.03] p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-cream">{req.type}</span>
                                <Badge className="text-[10px] bg-amber/20 text-amber">
                                  {req.status}
                                </Badge>
                              </div>
                              {req.details && (
                                <p className="mt-1 text-xs text-cream/70">{req.details}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-4 border-t border-cream/10 flex flex-col gap-2">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-cream/20 text-cream hover:bg-cream/10"
                      >
                        <Link to="/front-desk">Open Front Desk Board →</Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-cream/20 text-cream hover:bg-cream/10"
                      >
                        <Link to="/housekeeping">Open Housekeeping Board →</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        ) : activeTab === "crm" ? (
          <GuestCrmPanel canEdit={canEditCrm} />
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {STATUSES.map((status) => {
                const active = filter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(active ? "all" : status)}
                    aria-pressed={active}
                    className={`group flex items-center justify-between border p-4 text-left transition-colors duration-200 ${
                      active
                        ? "border-amber/70 bg-cream/[0.07]"
                        : "border-cream/15 bg-cream/[0.04] hover:border-cream/35"
                    }`}
                  >
                    <p className="signage flex items-center gap-2 text-cream/60">
                      <span aria-hidden className={`h-3 w-[3px] ${STATUS_ACCENT[status]}`} />
                      {STATUS_LABEL[status]}
                    </p>
                    <p className="font-display text-3xl leading-none tabular-nums">
                      {counts[status]}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-cream/10 pb-4">
              <span className="signage mr-1 text-cream/40">Filter</span>
              {["all", ...STATUSES].map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant="outline"
                  className={
                    filter === option
                      ? "border-amber bg-amber text-ink hover:bg-amber/90"
                      : "border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                  }
                  onClick={() => setFilter(option)}
                >
                  {option === "all" ? "All" : STATUS_LABEL[option]}
                </Button>
              ))}
              <span className="ml-auto text-xs text-cream/40">{visible.length} shown</span>
            </div>

            <OpsAssistant />

            {visible.length === 0 ? (
              <div className="mt-10 border border-dashed border-cream/20 bg-cream/[0.02] p-10 text-center">
                <p className="font-display text-2xl">Queue is clear</p>
                <p className="mt-2 text-sm text-cream/60">
                  New guest requests land here automatically.
                </p>
              </div>
            ) : (
              <ul className="mt-6 space-y-2">
                {visible.map((row) => {
                  const next = NEXT_ACTION[row.status];
                  const others = STATUSES.filter(
                    (status) => status !== row.status && status !== next?.status,
                  );
                  return (
                    <li
                      key={row.id}
                      className={`group relative border border-cream/15 bg-cream/[0.04] p-4 pl-6 transition-colors duration-200 hover:border-amber/60 ${row.status === "done" ? "opacity-70" : ""}`}
                    >
                      <span
                        aria-hidden
                        className={`absolute left-0 top-0 h-full w-[3px] ${STATUS_ACCENT[row.status]}`}
                      />
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-3">
                            <span className="font-display text-2xl tabular-nums">{row.room}</span>
                            <span className="text-base text-cream">{row.type}</span>
                            <Badge
                              className={
                                row.status === "new"
                                  ? "bg-amber text-ink"
                                  : row.status === "in_progress"
                                    ? "bg-sage text-ink"
                                    : "bg-cream/15 text-cream"
                              }
                            >
                              {STATUS_LABEL[row.status] ?? row.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-cream/50">
                            {row.guest_name ? `${row.guest_name} · ` : ""}
                            <span title={new Date(row.created_at).toLocaleString()}>
                              {timeAgo(row.created_at)}
                            </span>
                          </p>
                          {row.details ? (
                            <p className="mt-2 max-w-2xl text-sm text-cream/85">{row.details}</p>
                          ) : null}
                        </div>
                        {canTriage ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {next ? (
                              <Button
                                size="sm"
                                className="bg-amber text-ink hover:bg-amber/90"
                                onClick={() => setStatus(row.id, next.status)}
                              >
                                {next.label}
                              </Button>
                            ) : null}
                            {others.map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant="outline"
                                className="border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                                onClick={() => setStatus(row.id, status)}
                              >
                                {STATUS_LABEL[status]}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="signage text-cream/40">View only</p>
                        )}
                      </div>
                      <RequestWorkflowPanel
                        request={row}
                        canEdit={canTriage}
                        staff={staff ?? null}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {isManager ? (
          <div>
            <ScheduleBoard />
            <AssignmentBoard />
            <TeamPanel />
            <InvitePanel />
          </div>
        ) : null}

        {/* Tour Guide Card */}
        {tourStep !== null && tourStep < 4 && (
          <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40 w-full max-w-sm border border-amber/40 bg-ink shadow-2xl p-6 rounded-xl space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber font-mono">
                Step {tourStep} of 4
              </span>
              <span className="text-[10px] text-cream/40 font-mono">[ESC to exit]</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-cream">
                {tourStep === 1 && "Property Map"}
                {tourStep === 2 && "Housekeeping Queue"}
                {tourStep === 3 && "Guest CRM"}
              </h3>
              <p className="mt-1 text-sm text-cream/70 leading-relaxed font-sans">
                {tourStep === 1 && "See the property and room status at a glance."}
                {tourStep === 2 &&
                  "Prioritize rooms and coordinate turnovers without scattered texts."}
                {tourStep === 3 && "Give staff relevant guest context when it matters."}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setTourStep(null)}
                className="text-xs text-cream/40 hover:text-cream hover:underline font-sans"
              >
                Skip
              </button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tourStep === 1}
                  onClick={handlePrevStep}
                  className="border-cream/20 text-cream hover:bg-cream/10 disabled:opacity-30 font-sans"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleNextStep}
                  className="bg-amber text-ink font-bold hover:bg-amber/90 font-sans"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal Overlay (Step 4) */}
        {tourStep === 4 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
            <div className="w-full max-w-md border border-cream/15 bg-ink p-8 rounded-2xl space-y-6 shadow-2xl font-sans">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-cream">
                Your operational feedback matters
              </h2>

              {!feedbackSubmitted ? (
                <form onSubmit={submitFeedback} className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-cream/80 font-sans">
                      Would this make daily operations easier for your team?
                    </p>
                    <div className="flex gap-2 font-sans">
                      {(["Yes", "Maybe", "No"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFeedbackAnswer(opt)}
                          className={`flex-1 py-2 rounded-lg border font-semibold text-sm transition-all duration-150 ${
                            feedbackAnswer === opt
                              ? "border-amber bg-amber/15 text-amber"
                              : "border-cream/15 bg-cream/[0.02] text-cream/70 hover:border-cream/35 hover:text-cream"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 font-sans">
                    <Label htmlFor="changeText" className="text-xs text-cream/60">
                      What would you change or add?
                    </Label>
                    <textarea
                      id="changeText"
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full rounded-lg border border-cream/15 bg-cream/[0.02] p-3 text-sm text-cream focus:border-amber focus:outline-none"
                      placeholder="Enter optional suggestions..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 font-sans">
                    <button
                      type="button"
                      onClick={() => setTourStep(3)}
                      className="text-xs text-cream/40 hover:text-cream hover:underline font-sans"
                    >
                      Back
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTourStep(null)}
                        className="px-4 py-2 rounded-lg border border-cream/20 text-cream/70 text-sm hover:bg-cream/10"
                      >
                        Skip
                      </button>
                      <Button
                        type="submit"
                        className="bg-amber font-bold text-ink hover:bg-amber/90"
                      >
                        Send feedback
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center font-sans">
                  <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 p-3 w-12 h-12 flex items-center justify-center mx-auto text-emerald-400 font-bold">
                    ✓
                  </div>
                  <p className="text-sm text-cream/80 font-sans">
                    Your feedback has been prepared. Since there is no database connection
                    configured, please select an option below:
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={copyFeedback}
                      className="w-full bg-amber text-ink font-bold hover:bg-amber/90"
                    >
                      Copy feedback to clipboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={emailFeedback}
                      className="w-full border-cream/20 text-cream hover:bg-cream/10"
                    >
                      Open pre-filled Email client
                    </Button>
                  </div>
                  <div className="pt-4 border-t border-cream/10 font-sans">
                    <button
                      onClick={() => {
                        setTourStep(null);
                        setFeedbackSubmitted(false);
                        setFeedbackAnswer(null);
                        setFeedbackText("");
                      }}
                      className="text-xs text-cream/40 hover:text-cream hover:underline"
                    >
                      Close & Finish walkthrough
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Welcome Overlay */}
        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
            <div className="w-full max-w-md border border-cream/15 bg-ink p-8 rounded-2xl text-center space-y-6 shadow-2xl font-sans">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-cream">
                A calmer way to run the shift
              </h2>
              <p className="text-sm text-cream/70 leading-relaxed font-sans">
                Explore a working concept for room readiness, housekeeping coordination, property
                visibility, and guest context. All information shown is sample data only.
              </p>
              <div className="flex flex-col gap-3 pt-4 font-sans">
                <Button
                  onClick={handleStartTour}
                  className="w-full bg-amber font-bold text-ink hover:bg-amber/90"
                >
                  Start 60-second walkthrough
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkipTour}
                  className="w-full border-cream/20 text-cream hover:bg-cream/10"
                >
                  Explore on my own
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

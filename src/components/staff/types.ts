export type RequestRow = {
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

export const STATUSES = ["new", "in_progress", "done"] as const;

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  done: "Done",
};

export const STATUS_ACCENT: Record<string, string> = {
  new: "bg-amber",
  in_progress: "bg-sage",
  done: "bg-cream/25",
};

/** The one-tap forward move for each state; `done` is terminal. */
export const NEXT_ACTION: Record<string, { status: string; label: string } | null> = {
  new: { status: "in_progress", label: "Start" },
  in_progress: { status: "done", label: "Complete" },
  done: null,
};

export type DashboardTab =
  "overview" | "queue" | "map" | "crm" | "maintenance" | "analytics" | "schedules" | "assignments" | "assistant" | "team";

import {
  AlertCircle,
  BedDouble,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type RoomService = {
  id: string;
  label: string;
  prompt: string;
  icon: LucideIcon;
};

export type GuestMessage = {
  id: string;
  body: string;
  sender: string;
  author_name: string | null;
  created_at: string;
};

export type GuestRequestRow = {
  id: string;
  type: string;
  details: string | null;
  status: string;
  created_at: string;
};

export const REQUESTS: RoomService[] = [
  {
    id: "towels",
    label: "Fresh Towels & Linens",
    prompt: "How many towels or linens do you need for the bath?",
    icon: Sparkles,
  },
  {
    id: "housekeeping",
    label: "Housekeeping Refresh",
    prompt: "Tell us the best time to stop by for a quick room tidy.",
    icon: BedDouble,
  },
  {
    id: "problem",
    label: "Maintenance & Repairs",
    prompt: "What needs attention or repair in your room?",
    icon: Wrench,
  },
  {
    id: "front-desk",
    label: "Front Desk Assistance",
    prompt: "How can our front desk team help you right now?",
    icon: MessageSquare,
  },
  {
    id: "late-checkout",
    label: "Request Late Checkout",
    prompt: "What time would you prefer to depart tomorrow?",
    icon: Clock,
  },
];

export const STATUS_CONFIG: Record<string, { label: string; class: string; icon: LucideIcon }> = {
  new: { label: "Received", class: "bg-amber/15 text-amber border-amber/30", icon: Clock },
  in_progress: {
    label: "In Progress",
    class: "bg-primary/15 text-primary border-primary/30",
    icon: AlertCircle,
  },
  done: {
    label: "Completed",
    class: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle2,
  },
};

/** Local time-of-day label used across the request list and chat. */
export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

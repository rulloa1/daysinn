/**
 * Operations domain model.
 *
 * These are the presentation-level types the boards work with. They map onto
 * the existing database shape (`rooms.status` enum + the newer wing / side /
 * guest_status / hk_stage / priority / linen_change columns) — see
 * `src/lib/room-model.ts` for the translation in both directions.
 */

export type RoomStatus =
  | "Clean"
  | "Dirty"
  | "In Progress"
  | "Inspected"
  | "DND"
  | "Maintenance"
  | "Stayover";

export type GuestStatus =
  | "Vacant"
  | "Occupied"
  | "Checkout"
  | "Stayover"
  | "Expected Arrival"
  | "Out of Order";

export type PriorityLevel = "Normal" | "High" | "VIP";

export type WingName = "North Wing" | "West Wing" | "South Wing";

export interface Room {
  id: string;
  number: string;
  wing: WingName;
  floor: 1 | 2;
  side: string;
  type: string;
  status: RoomStatus;
  guest_status: GuestStatus;
  assigned_to: string;
  priority: PriorityLevel;
  linen_change: boolean;
  notes: string;
  last_updated: string;
}

export type TicketUrgency = "Low" | "Normal" | "High" | "Urgent";
export type TicketStatus = "Open" | "In Progress" | "Resolved";

export interface MaintenanceTicket {
  id: string;
  room: string;
  category: string;
  description: string;
  urgency: TicketUrgency;
  reporter: string;
  status: TicketStatus;
  date: string;
}

export const ROOM_STATUSES: RoomStatus[] = [
  "Clean",
  "Dirty",
  "In Progress",
  "Inspected",
  "DND",
  "Maintenance",
  "Stayover",
];

export const GUEST_STATUSES: GuestStatus[] = [
  "Vacant",
  "Occupied",
  "Checkout",
  "Stayover",
  "Expected Arrival",
  "Out of Order",
];

export const PRIORITY_LEVELS: PriorityLevel[] = ["Normal", "High", "VIP"];

export const WING_NAMES: WingName[] = ["North Wing", "West Wing", "South Wing"];

export const TICKET_URGENCIES: TicketUrgency[] = ["Low", "Normal", "High", "Urgent"];

export const TICKET_STATUSES: TicketStatus[] = ["Open", "In Progress", "Resolved"];

export const TICKET_CATEGORIES = [
  "General",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance",
  "Furniture",
  "Door / Lock",
  "TV / Internet",
] as const;

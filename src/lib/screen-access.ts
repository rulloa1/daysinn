import type { AppRole } from "@/hooks/use-staff-role";

/** Every guarded surface in the ops portal. */
export type OpsScreenId =
  | "front-desk"
  | "housekeeping"
  | "queue"
  | "team"
  | "roles"
  | "shifts"
  | "map"
  | "crm"
  | "maintenance"
  | "analytics"
  | "assignments";

type ScreenPolicy = {
  label: string;
  /** Roles allowed to open the screen at all. */
  view: readonly AppRole[];
  /** Roles allowed to make changes on it; a subset of `view`. */
  act: readonly AppRole[];
};

const MANAGER = ["manager"] as const;
const FRONT_DESK = ["manager", "staff"] as const;
const OPERATIONS = ["manager", "staff", "housekeeper"] as const;

/**
 * The single source of truth for who can see and act on each ops screen.
 *
 * The UI reads this so navigation, routing and controls agree; the server
 * functions and RLS policies enforce the same split independently, so a user
 * who bypasses the UI still cannot read or write outside their role.
 */
export const SCREEN_ACCESS: Record<OpsScreenId, ScreenPolicy> = {
  "front-desk": { label: "Front desk", view: FRONT_DESK, act: FRONT_DESK },
  housekeeping: { label: "Housekeeping", view: OPERATIONS, act: OPERATIONS },
  queue: { label: "Request queue", view: OPERATIONS, act: OPERATIONS },
  map: { label: "Property map", view: OPERATIONS, act: FRONT_DESK },
  crm: { label: "Guest CRM", view: FRONT_DESK, act: FRONT_DESK },
  maintenance: { label: "Maintenance", view: OPERATIONS, act: OPERATIONS },
  analytics: { label: "Analytics", view: MANAGER, act: MANAGER },
  shifts: { label: "Shifts", view: MANAGER, act: MANAGER },
  assignments: { label: "Assignments", view: MANAGER, act: MANAGER },
  team: { label: "Team & invites", view: MANAGER, act: MANAGER },
  roles: { label: "Roles", view: MANAGER, act: MANAGER },
};

export function canViewScreen(roles: readonly AppRole[], screen: OpsScreenId): boolean {
  return SCREEN_ACCESS[screen].view.some((role) => roles.includes(role));
}

export function canActOnScreen(roles: readonly AppRole[], screen: OpsScreenId): boolean {
  return SCREEN_ACCESS[screen].act.some((role) => roles.includes(role));
}

/** The screen a user should land on when they can't view the one they asked for. */
export function fallbackScreen(roles: readonly AppRole[]): OpsScreenId | null {
  const order: OpsScreenId[] = ["queue", "housekeeping", "front-desk", "team"];
  return order.find((screen) => canViewScreen(roles, screen)) ?? null;
}

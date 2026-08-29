export interface RequestTypeDefinition {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  iconName: string;
  defaultPriority: "urgent" | "normal";
}

/**
 * The canonical list of 4 guest-facing in-room request types.
 * Shared across the Guest Homepage, Request Sheet, and Ops Portal Staff Queue.
 */
export const GUEST_REQUEST_TYPES: RequestTypeDefinition[] = [
  {
    id: "fresh_towels",
    name: "Fresh Towels & Linens",
    shortLabel: "Towels & Linens",
    description: "Bath towels, washcloths, extra pillows",
    iconName: "Sparkles",
    defaultPriority: "normal",
  },
  {
    id: "housekeeping_refresh",
    name: "Housekeeping Refresh",
    shortLabel: "Room Refresh",
    description: "Room tidy, trash removal & amenities",
    iconName: "RefreshCw",
    defaultPriority: "normal",
  },
  {
    id: "maintenance",
    name: "Maintenance & Repairs",
    shortLabel: "Repairs",
    description: "Fast repair dispatch to your room",
    iconName: "Wrench",
    defaultPriority: "urgent",
  },
  {
    id: "front_desk",
    name: "Front Desk Assistance",
    shortLabel: "Front Desk",
    description: "Direct messaging with our front team",
    iconName: "MessageSquare",
    defaultPriority: "normal",
  },
];

export function lookupRequestType(typeString: string): RequestTypeDefinition | undefined {
  const norm = typeString.toLowerCase();
  return GUEST_REQUEST_TYPES.find(
    (t) =>
      t.id === norm ||
      t.name.toLowerCase() === norm ||
      t.shortLabel.toLowerCase() === norm ||
      norm.includes(t.shortLabel.toLowerCase()),
  );
}

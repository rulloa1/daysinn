export type RoomStatusType =
  "Clean" | "Dirty" | "Inspected" | "Out of Order" | "Occupied" | "Vacant";

export interface PropertyRoomData {
  number: string;
  status: RoomStatusType;
  floor: "1st" | "2nd";
  type: string;
  housekeeper?: string;
  lastCleaned?: string;
  guestName?: string;
  notes?: string;
}

export const STATUS_COLORS: Record<
  RoomStatusType,
  {
    bg: string;
    border: string;
    text: string;
    lightBg: string;
    pillBg: string;
    pillText: string;
  }
> = {
  Clean: {
    bg: "#a3e635", // Vibrant light green
    border: "#84cc16",
    text: "#1e3a10",
    lightBg: "#ecfccb",
    pillBg: "#dcfce7",
    pillText: "#15803d",
  },
  Dirty: {
    bg: "#f87171", // Soft red/coral
    border: "#ef4444",
    text: "#450a0a",
    lightBg: "#fee2e2",
    pillBg: "#fee2e2",
    pillText: "#b91c1c",
  },
  Inspected: {
    bg: "#93c5fd", // Soft sky blue
    border: "#60a5fa",
    text: "#1e3a8a",
    lightBg: "#eff6ff",
    pillBg: "#dbeafe",
    pillText: "#1d4ed8",
  },
  "Out of Order": {
    bg: "#cbd5e1", // Light slate
    border: "#94a3b8",
    text: "#334155",
    lightBg: "#f1f5f9",
    pillBg: "#f1f5f9",
    pillText: "#475569",
  },
  Occupied: {
    bg: "#fde047", // Warm soft yellow
    border: "#eab308",
    text: "#713f12",
    lightBg: "#fef9c3",
    pillBg: "#fef3c7",
    pillText: "#b45309",
  },
  Vacant: {
    bg: "#e2e8f0", // Clean subtle grey
    border: "#cbd5e1",
    text: "#475569",
    lightBg: "#f8fafc",
    pillBg: "#f8fafc",
    pillText: "#64748b",
  },
};

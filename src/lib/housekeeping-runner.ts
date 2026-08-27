export type RoomStatus =
  "vacant_clean" | "vacant_dirty" | "occupied" | "occupied_dnd" | "out_of_order" | "reserved";

export type RunnerRoom = {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  guest_name?: string | null;
  check_out?: string | null;
  notes?: string | null;
  dnd?: boolean;
  extended_stay?: boolean;
  updated_at?: string;
  assigned_staff_id?: string | null;
  assigned_name?: string | null;
  hk_stage?: string | null;
  priority?: string | null;
  linen_change?: boolean | null;
};

export type RunnerFilter = "all" | "dirty_only" | "mine" | "floor_1" | "floor_2";
export type RunnerSortMode = "walking_order" | "priority_dirty_first" | "numeric_asc";

/**
 * Returns a human-friendly wing/landmark descriptor for a given room number.
 */
export function getRoomLandmark(roomNumber: string): { wing: string; landmark: string } {
  const num = parseInt(roomNumber, 10);
  if (isNaN(num)) return { wing: "Main Building", landmark: "Property Ground" };

  const floor = num >= 200 ? 2 : 1;
  const sub = floor === 2 ? num - 200 : num - 100;

  if (sub <= 35) {
    if (sub <= 10) {
      return {
        wing: `Floor ${floor} · Front Entrance Wing`,
        landmark: floor === 2 ? "Near Front Stairwell / Lobby" : "Near Main Lobby & Registration",
      };
    }
    if (sub <= 20) {
      return {
        wing: `Floor ${floor} · Front Center Corridor`,
        landmark: floor === 2 ? "Near Central Breezeway" : "Front Walkway",
      };
    }
    return {
      wing: `Floor ${floor} · Front East Wing`,
      landmark: "Near East Stairwell / Corner",
    };
  }

  // Vertical Courtyard / Pool Wing (36+)
  if (sub <= 50) {
    return {
      wing: `Floor ${floor} · Courtyard Wing`,
      landmark: "Near Pool & Central Courtyard",
    };
  }
  if (sub <= 65) {
    return {
      wing: `Floor ${floor} · North Courtyard Wing`,
      landmark: "Near Courtyard Stairs / Breezeway",
    };
  }
  return {
    wing: `Floor ${floor} · North End Wing`,
    landmark: "North End Walkway",
  };
}

/**
 * Physical corridor walking rank. Lower score means visited earlier in a natural walking route.
 */
export function getWalkingOrderScore(roomNumber: string): number {
  const num = parseInt(roomNumber, 10);
  if (isNaN(num)) return 9999;

  const floor = num >= 200 ? 2 : 1;
  const sub = floor === 2 ? num - 200 : num - 100;

  // Walk Floor 1 first (1000..1999), then Floor 2 (2000..2999)
  const floorBase = floor * 1000;

  // In each floor:
  // 1. Front Wing (0..35): Walk from 100 -> 135
  if (sub <= 35) {
    return floorBase + sub;
  }

  // 2. Vertical Courtyard Wing (36..72): Walk from 136 -> end
  return floorBase + 100 + sub;
}

/**
 * Filter and sort rooms for the runner queue.
 */
export function buildRunnerQueue<T extends RunnerRoom>(
  rooms: T[],
  filter: RunnerFilter,
  sortMode: RunnerSortMode,
  currentStaffId?: string | null,
): T[] {
  const filtered = rooms.filter((r) => {
    switch (filter) {
      case "dirty_only":
        return r.status === "vacant_dirty";
      case "mine":
        return Boolean(currentStaffId && r.assigned_staff_id === currentStaffId);
      case "floor_1":
        return r.floor === 1;
      case "floor_2":
        return r.floor === 2;
      case "all":
      default:
        return true;
    }
  });

  return filtered.sort((a, b) => {
    if (sortMode === "priority_dirty_first") {
      // 1. Vacant dirty first
      const aDirty = a.status === "vacant_dirty" ? 0 : 1;
      const bDirty = b.status === "vacant_dirty" ? 0 : 1;
      if (aDirty !== bDirty) return aDirty - bDirty;

      // 2. Within dirty/non-dirty, follow walking order
      return getWalkingOrderScore(a.number) - getWalkingOrderScore(b.number);
    }

    if (sortMode === "numeric_asc") {
      const aNum = parseInt(a.number, 10) || 0;
      const bNum = parseInt(b.number, 10) || 0;
      return aNum - bNum;
    }

    // Default: walking_order
    return getWalkingOrderScore(a.number) - getWalkingOrderScore(b.number);
  });
}

/**
 * Calculates completion and progress metrics for the runner queue.
 */
export function getRunnerMetrics(rooms: RunnerRoom[]) {
  const total = rooms.length;
  if (total === 0) {
    return {
      total: 0,
      cleaned: 0,
      remainingDirty: 0,
      inProgress: 0,
      dndCount: 0,
      percentComplete: 100,
    };
  }

  const cleaned = rooms.filter((r) => r.status === "vacant_clean").length;
  const remainingDirty = rooms.filter((r) => r.status === "vacant_dirty").length;
  const inProgress = rooms.filter((r) => r.hk_stage === "in_progress").length;
  const dndCount = rooms.filter((r) => r.dnd || r.status === "occupied_dnd").length;
  const percentComplete = Math.round((cleaned / total) * 100);

  return {
    total,
    cleaned,
    remainingDirty,
    inProgress,
    dndCount,
    percentComplete,
  };
}

/**
 * Finds the index of the next uncleaned room after the current index.
 * If none found after, wraps around to find the first uncleaned room.
 */
export function findNextDirtyRoomIndex(rooms: RunnerRoom[], currentIndex: number): number {
  if (rooms.length === 0) return 0;

  // Check forward from currentIndex + 1
  for (let i = currentIndex + 1; i < rooms.length; i++) {
    if (rooms[i]?.status === "vacant_dirty") {
      return i;
    }
  }

  // Wrap around from beginning up to currentIndex
  for (let i = 0; i < currentIndex; i++) {
    if (rooms[i]?.status === "vacant_dirty") {
      return i;
    }
  }

  // If no dirty rooms left, move to next room sequentially or stay
  return Math.min(currentIndex + 1, rooms.length - 1);
}

import type { DbRoomStatus } from "@/lib/room-model";

/** A row of the `rooms_board()` projection as the front-desk board reads it. */
export type RoomRow = {
  id: string;
  number: string;
  floor: number;
  bed_type: string;
  status: DbRoomStatus;
  guest_name: string | null;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
  wing: string | null;
  side: string | null;
  guest_status: string | null;
  hk_stage: string | null;
  priority: string | null;
  linen_change: boolean | null;
  updated_at: string;
};

/** The subset of room columns the board is allowed to write. */
export type RoomPatch = {
  status?: DbRoomStatus;
  guest_name?: string | null;
  notes?: string | null;
  guest_status?: string | null;
  hk_stage?: string | null;
  priority?: string;
  linen_change?: boolean;
};

export type RequestRow = {
  id: string;
  room: string;
  type: string;
  details?: string | null;
  status: string;
  created_at: string;
  started_at?: string | null;
  started_by_name?: string | null;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
};

export type BookingRow = {
  id: string;
  guest_name: string;
  room: string;
  phone: string | null;
  check_in: string;
  check_out: string;
  notes: string | null;
  guest_email: string | null;
  guests: number | null;
  room_type: string | null;
};

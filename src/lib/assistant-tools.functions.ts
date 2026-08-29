import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { average } from "@/lib/ops";
import { ASSISTANT_ROOM_STATUSES, fromAssistantRoomStatus } from "@/lib/room-model";
import type { Database } from "@/integrations/supabase/types";

type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];
type RequestRow = Database["public"]["Tables"]["requests"]["Row"];
type SerializableValue = string | number | boolean | null;
type SerializableRecord = Record<string, SerializableValue>;

function toSerializable(records: unknown[]): SerializableRecord[] {
  return records.map((r) => {
    const out: SerializableRecord = {};
    if (r && typeof r === "object") {
      for (const [k, v] of Object.entries(r)) {
        out[k] =
          v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean"
            ? (v as SerializableValue)
            : String(v);
      }
    }
    return out;
  });
}

export const listRooms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        status: z.string().trim().optional(),
        floor: z.coerce.number().int().min(1).max(20).optional(),
        limit: z.coerce.number().int().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("rooms_board");
    if (error) throw new Error(error.message);
    const rooms = toSerializable(rows ?? [])
      .filter((r) => (data.status ? r["status"] === data.status : true))
      .filter((r) => (data.floor != null ? Number(r["floor"]) === data.floor : true))
      .slice(0, data.limit);
    return { count: rooms.length, rooms };
  });

export const listRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        status: z.enum(["new", "in_progress", "done", "all"]).default("all"),
        room: z.string().trim().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(25),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("requests_board");
    if (error) throw new Error(error.message);
    const requests = toSerializable(rows ?? [])
      .filter((r) => (data.status === "all" ? true : r["status"] === data.status))
      .filter((r) => (data.room ? String(r["room"]) === data.room : true))
      .slice(0, data.limit);
    return { count: requests.length, requests };
  });

export const updateRoomStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        room_number: z.string().trim().min(1).max(10),
        status: z.enum(ASSISTANT_ROOM_STATUSES),
        dnd: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // The assistant speaks plain English ("clean", "in_progress"); none of those
    // are members of the room_status enum, so the mapping is not optional.
    const next = fromAssistantRoomStatus(data.status);
    const patch: Partial<RoomRow> = {
      hk_stage: next.hk_stage,
      updated_at: new Date().toISOString(),
    };
    if (next.status) patch["status"] = next.status;
    if (typeof next.dnd === "boolean") patch["dnd"] = next.dnd;
    if (typeof data.dnd === "boolean") patch["dnd"] = data.dnd;

    const { data: room, error } = await context.supabase
      .from("rooms")
      .update(patch)
      .eq("number", data.room_number)
      .select("id, number, status, hk_stage, dnd, floor")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!room) throw new Error(`Room ${data.room_number} not found or access denied.`);
    return { room: toSerializable([room])[0] };
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        request_id: z.string().uuid(),
        status: z.enum(["new", "in_progress", "done"]),
        note: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch: Partial<RequestRow> = {
      status: data.status as RequestRow["status"],
      updated_at: now,
    };
    if (data.status === "in_progress") patch["started_at"] = now;
    if (data.status === "done") patch["resolved_at"] = now;

    const { data: request, error } = await context.supabase
      .from("requests")
      .update(patch)
      .eq("id", data.request_id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!request) throw new Error("Request not found or access denied.");

    if (data.note) {
      const email =
        typeof context.claims === "object" && context.claims !== null && "email" in context.claims
          ? String(context.claims["email"] ?? "")
          : "";
      await context.supabase.from("request_notes").insert({
        request_id: data.request_id,
        status_to: data.status,
        body: data.note,
        author_staff_id: context.userId ?? null,
        author_name: email || "Assistant",
      });
    }

    return { request: toSerializable([request])[0] };
  });

export const getPropertySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const { data: rooms, error: roomsError } = await context.supabase.rpc("rooms_board");
    if (roomsError) throw new Error(roomsError.message);

    const { data: requests, error: reqError } = await context.supabase.rpc("requests_board");
    if (reqError) throw new Error(reqError.message);

    const roomRows = toSerializable(rooms ?? []);
    const reqRows = toSerializable(requests ?? []);

    const total = roomRows.length;
    const occupied = roomRows.filter(
      (r) => r["status"] === "occupied" || r["status"] === "occupied_dnd",
    ).length;
    const clean = roomRows.filter((r) => r["status"] === "vacant_clean").length;
    const dirty = roomRows.filter((r) => r["status"] === "vacant_dirty").length;
    const ooo = roomRows.filter((r) => r["status"] === "out_of_order").length;
    const occupancy = total ? Math.round((occupied / total) * 100) : 0;

    const openReqs = reqRows.filter((r) => r["status"] !== "done").length;
    const avgResponse = average(
      reqRows
        .filter((r) => r["status"] === "done" && r["response_seconds"] != null)
        .map((r) => Number(r["response_seconds"])),
    );

    return {
      totalRooms: total,
      occupiedRooms: occupied,
      cleanRooms: clean,
      dirtyRooms: dirty,
      outOfOrderRooms: ooo,
      occupancyRate: occupancy,
      openRequests: openReqs,
      averageResponseSeconds: avgResponse,
    };
  });

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        work_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        staff_name: z.string().trim().max(80).optional(),
        limit: z.coerce.number().int().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("shift_room_assignments")
      .select("id, work_date, staff_name, room_number, schedule_id")
      .order("work_date", { ascending: false })
      .order("room_number")
      .limit(data.limit);

    if (data.work_date) query = query.eq("work_date", data.work_date);
    if (data.staff_name) query = query.ilike("staff_name", `%${data.staff_name}%`);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const assignments = toSerializable(rows ?? []);
    return { count: assignments.length, assignments };
  });

export const listSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        work_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        staff_name: z.string().trim().max(80).optional(),
        department: z.string().trim().max(40).optional(),
        limit: z.coerce.number().int().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("staff_schedules")
      .select("id, work_date, staff_name, department, start_time, end_time, published, notes")
      .order("work_date", { ascending: false })
      .order("start_time")
      .limit(data.limit);

    if (data.work_date) query = query.eq("work_date", data.work_date);
    if (data.staff_name) query = query.ilike("staff_name", `%${data.staff_name}%`);
    if (data.department) query = query.eq("department", data.department);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const schedules = toSerializable(rows ?? []);
    return { count: schedules.length, schedules };
  });

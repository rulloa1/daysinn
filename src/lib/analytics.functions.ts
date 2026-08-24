import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function startOfDay(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function dateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const getOccupancyTrend = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ days: z.number().int().min(1).max(90).default(14) }).parse(input))
  .handler(async ({ data, context }) => {
    const since = startOfDay(-data.days + 1);
    const { data: bookings, error } = await context.supabase
      .from("bookings")
      .select("check_in, check_out")
      .gte("check_in", since.slice(0, 10))
      .order("check_in");

    if (error) throw new Error(error.message);

    const { data: rooms } = await context.supabase.from("rooms").select("id");
    const roomCount = (rooms ?? []).length || 1;

    const points: { date: string; occupancy: number }[] = [];
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dateKey(d.toISOString());
      const occupied = (bookings ?? []).filter((b) => {
        const inDate = new Date(b.check_in);
        const outDate = new Date(b.check_out);
        const point = new Date(key);
        return inDate <= point && outDate > point;
      }).length;
      points.push({ date: key, occupancy: Math.round((occupied / roomCount) * 100) });
    }
    return points;
  });

export const getRoomStatusBreakdown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("rooms_board");
    if (error) throw new Error(error.message);

    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      const status = String(row["status"] ?? "unknown");
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  });

export const getTurnaroundByHousekeeper = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ days: z.number().int().min(1).max(90).default(14) }).parse(input))
  .handler(async ({ data, context }) => {
    const since = startOfDay(-data.days + 1);
    const { data: events, error } = await context.supabase
      .from("room_status_events")
      .select("staff_name, duration_seconds, is_turnover")
      .gte("changed_at", since)
      .eq("is_turnover", true)
      .not("duration_seconds", "is", null);

    if (error) throw new Error(error.message);

    const buckets: Record<string, number[]> = {};
    for (const e of (events ?? []) as Array<{ staff_name: string | null; duration_seconds: number | null }>) {
      const name = e.staff_name ?? "Unknown";
      if (e.duration_seconds == null) continue;
      (buckets[name] ??= []).push(e.duration_seconds);
    }

    return Object.entries(buckets)
      .map(([name, values]) => ({
        name,
        avgSeconds: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        count: values.length,
      }))
      .sort((a, b) => a.avgSeconds - b.avgSeconds);
  });

export const getRequestVolume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ days: z.number().int().min(1).max(90).default(14) }).parse(input))
  .handler(async ({ data, context }) => {
    const since = startOfDay(-data.days + 1);
    const { data: requests, error } = await context.supabase
      .from("requests")
      .select("type, status, created_at, response_seconds")
      .gte("created_at", since)
      .order("created_at");

    if (error) throw new Error(error.message);

    const byCategory: Record<string, { count: number; avgResponseSeconds: number | null; resolved: number }> = {};
    for (const r of (requests ?? []) as Array<{
      type: string;
      status: string;
      created_at: string;
      response_seconds: number | null;
    }>) {
      const bucket = byCategory[r.type] ?? { count: 0, resolved: 0, responseSeconds: [] as number[] };
      bucket.count++;
      if (r.status === "done") bucket.resolved++;
      if (r.response_seconds != null) (bucket as unknown as Record<string, unknown>).responseSeconds = [...((bucket as unknown as Record<string, unknown>).responseSeconds as number[] ?? []), r.response_seconds];
      byCategory[r.type] = bucket as unknown as { count: number; avgResponseSeconds: number | null; resolved: number };
    }

    return Object.entries(byCategory).map(([type, b]) => {
      const responseSeconds = (b as unknown as { responseSeconds?: number[] }).responseSeconds ?? [];
      return {
        type,
        count: b.count,
        resolved: b.resolved,
        avgResponseSeconds:
          responseSeconds.length > 0
            ? Math.round(responseSeconds.reduce((a, c) => a + c, 0) / responseSeconds.length)
            : null,
      };
    });
  });

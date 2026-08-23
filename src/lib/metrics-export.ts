import { supabase } from "@/integrations/supabase/client";
import { average, formatDuration } from "@/lib/ops";

export type ExportRange = 7 | 30 | 90;

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sinceIso(days: ExportRange) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

type EventRow = {
  changed_at: string;
  room_number: string;
  old_status: string | null;
  new_status: string;
  staff_name: string | null;
  duration_seconds: number | null;
  is_turnover: boolean;
};

type ResolvedRow = {
  id: string;
  room: string;
  type: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by_name: string | null;
  response_seconds: number | null;
};

export async function fetchMetricsData(days: ExportRange) {
  const since = sinceIso(days);

  const [events, requests] = await Promise.all([
    supabase
      .from("room_status_events")
      .select(
        "changed_at, room_number, old_status, new_status, staff_name, duration_seconds, is_turnover",
      )
      .gte("changed_at", since)
      .order("changed_at", { ascending: false }),
    supabase
      .from("requests")
      .select("id, room, type, status, created_at, resolved_at, resolved_by_name, response_seconds")
      .not("resolved_at", "is", null)
      .gte("resolved_at", since)
      .order("resolved_at", { ascending: false }),
  ]);

  if (events.error) throw events.error;
  if (requests.error) throw requests.error;

  return {
    since,
    events: (events.data ?? []) as EventRow[],
    resolved: (requests.data ?? []) as ResolvedRow[],
  };
}

export function buildEventsCsv(events: EventRow[]) {
  return toCsv(
    [
      "changed_at",
      "day",
      "room",
      "old_status",
      "new_status",
      "staff",
      "duration_seconds",
      "duration_readable",
      "is_turnover",
    ],
    events.map((event) => [
      event.changed_at,
      dayKey(event.changed_at),
      event.room_number,
      event.old_status ?? "",
      event.new_status,
      event.staff_name ?? "",
      event.duration_seconds ?? "",
      formatDuration(event.duration_seconds),
      event.is_turnover ? "yes" : "no",
    ]),
  );
}

export function buildResolvedCsv(resolved: ResolvedRow[]) {
  return toCsv(
    [
      "request_id",
      "room",
      "type",
      "status",
      "created_at",
      "resolved_at",
      "resolved_by",
      "response_seconds",
      "response_readable",
    ],
    resolved.map((request) => [
      request.id,
      request.room,
      request.type,
      request.status,
      request.created_at,
      request.resolved_at ?? "",
      request.resolved_by_name ?? "",
      request.response_seconds ?? "",
      formatDuration(request.response_seconds),
    ]),
  );
}

export function buildSummaryCsv(events: EventRow[], resolved: ResolvedRow[]) {
  const days = new Set<string>();
  events.forEach((event) => days.add(dayKey(event.changed_at)));
  resolved.forEach((request) => {
    if (request.resolved_at) days.add(dayKey(request.resolved_at));
  });

  const rows = [...days]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((day) => {
      const turnovers = events.filter(
        (event) =>
          event.is_turnover && dayKey(event.changed_at) === day && event.duration_seconds != null,
      );
      const responses = resolved.filter(
        (request) =>
          request.resolved_at &&
          dayKey(request.resolved_at) === day &&
          request.response_seconds != null,
      );
      const avgTurnover = average(turnovers.map((event) => event.duration_seconds as number));
      const avgResponse = average(responses.map((request) => request.response_seconds as number));

      return [
        day,
        turnovers.length,
        avgTurnover ?? "",
        formatDuration(avgTurnover),
        responses.length,
        avgResponse ?? "",
        formatDuration(avgResponse),
        events.filter((event) => dayKey(event.changed_at) === day).length,
      ];
    });

  return toCsv(
    [
      "day",
      "turnovers",
      "avg_turnover_seconds",
      "avg_turnover_readable",
      "requests_resolved",
      "avg_response_seconds",
      "avg_response_readable",
      "status_changes",
    ],
    rows,
  );
}

export async function exportMetricsCsvs(days: ExportRange) {
  const { events, resolved } = await fetchMetricsData(days);
  const stamp = new Date().toISOString().slice(0, 10);
  const prefix = `daysinn-metrics-${days}d-${stamp}`;

  downloadCsv(`${prefix}-summary.csv`, buildSummaryCsv(events, resolved));
  downloadCsv(`${prefix}-room-status-events.csv`, buildEventsCsv(events));
  downloadCsv(`${prefix}-resolved-requests.csv`, buildResolvedCsv(resolved));

  return { events: events.length, resolved: resolved.length };
}

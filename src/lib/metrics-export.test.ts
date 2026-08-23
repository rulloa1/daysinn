import { describe, it, expect } from "vitest";
import { buildSummaryCsv, buildEventsCsv, buildResolvedCsv } from "@/lib/metrics-export";
const ev = [
  {
    changed_at: "2026-08-23T10:00:00Z",
    room_number: "101",
    old_status: "vacant_dirty",
    new_status: "vacant_clean",
    staff_name: "Ana, R",
    duration_seconds: 1800,
    is_turnover: true,
  },
] as Parameters<typeof buildEventsCsv>[0];
const rq = [
  {
    id: "1",
    room: "101",
    type: "towels",
    status: "resolved",
    created_at: "2026-08-23T09:00:00Z",
    resolved_at: "2026-08-23T09:05:00Z",
    resolved_by_name: "Sam",
    response_seconds: 300,
  },
] as Parameters<typeof buildResolvedCsv>[0];
describe("csv", () => {
  it("quotes and summarizes", () => {
    expect(buildEventsCsv(ev)).toContain('"Ana, R"');
    const s = buildSummaryCsv(ev, rq);
    expect(s).toContain("2026-08-23,1,1800,30m,1,300,5m,1");
    expect(buildResolvedCsv(rq)).toContain("5m");
  });
});

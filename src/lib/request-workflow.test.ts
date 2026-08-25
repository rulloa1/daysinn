import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mocks.from },
}));

import {
  addRequestNote,
  advanceRequest,
  isRequestStatus,
  statusPatch,
  type WorkflowRequest,
} from "./request-workflow";

const request: WorkflowRequest = {
  id: "request-1",
  status: "new",
  created_at: "2026-08-25T10:00:00.000Z",
};

const staff = { id: "staff-1", name: "Jordan" };

function setupWorkflow({
  requestError,
  noteError,
}: { requestError?: string; noteError?: string } = {}) {
  const eq = vi.fn().mockResolvedValue({
    error: requestError ? { message: requestError } : null,
  });
  const update = vi.fn(() => ({ eq }));
  const insert = vi.fn().mockResolvedValue({
    error: noteError ? { message: noteError } : null,
  });

  mocks.from.mockImplementation((table: string) => {
    if (table === "requests") return { update };
    if (table === "request_notes") return { insert };
    throw new Error(`Unexpected table: ${table}`);
  });

  return { eq, update, insert };
}

describe("request workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T10:05:30.000Z"));
  });

  it("recognizes only supported lifecycle statuses", () => {
    expect(isRequestStatus("new")).toBe(true);
    expect(isRequestStatus("in_progress")).toBe(true);
    expect(isRequestStatus("done")).toBe(true);
    expect(isRequestStatus("cancelled")).toBe(false);
  });

  it("records the assigned staff member and a stable start timestamp", () => {
    expect(statusPatch("in_progress", request, staff)).toEqual({
      status: "in_progress",
      started_at: "2026-08-25T10:05:30.000Z",
      started_by_staff_id: "staff-1",
      started_by_name: "Jordan",
      resolved_at: null,
      resolved_by_staff_id: null,
      resolved_by_name: null,
      response_seconds: null,
    });
  });

  it("resolves requests using the same timestamp for completion and response duration", () => {
    expect(statusPatch("done", request, staff)).toEqual({
      status: "done",
      resolved_at: "2026-08-25T10:05:30.000Z",
      resolved_by_staff_id: "staff-1",
      resolved_by_name: "Jordan",
      response_seconds: 330,
    });
  });

  it("rejects unsupported transitions before writing to the database", async () => {
    const result = await advanceRequest(request, "cancelled", staff);

    expect(result).toEqual({ error: "Invalid request status.", updated: false });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("reports a failed request update without writing a timeline entry", async () => {
    const { insert } = setupWorkflow({ requestError: "Status unavailable" });

    const result = await advanceRequest(request, "in_progress", staff);

    expect(result).toEqual({ error: "Status unavailable", updated: false });
    expect(insert).not.toHaveBeenCalled();
  });

  it("reports a timeline write failure after the request update succeeds", async () => {
    const { update, insert } = setupWorkflow({ noteError: "Timeline unavailable" });

    const result = await advanceRequest(request, "in_progress", staff, "  Sent a runner.  ");

    expect(result).toEqual({ error: "Timeline unavailable", updated: true });
    expect(update).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledWith({
      request_id: "request-1",
      body: "Sent a runner.",
      status_from: "new",
      status_to: "in_progress",
      author_staff_id: "staff-1",
      author_name: "Jordan",
    });
  });

  it("rejects blank or too-short notes without calling the database", async () => {
    const result = await addRequestNote("request-1", " ", staff);

    expect(result).toEqual({ error: "A request note must contain at least two characters." });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("trims and saves valid standalone notes", async () => {
    const { insert } = setupWorkflow();

    const result = await addRequestNote("request-1", "  Guest called back.  ", staff);

    expect(result).toEqual({ error: null });
    expect(insert).toHaveBeenCalledWith({
      request_id: "request-1",
      body: "Guest called back.",
      author_staff_id: "staff-1",
      author_name: "Jordan",
    });
  });
});

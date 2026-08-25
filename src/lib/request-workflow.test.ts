import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mocks.from, rpc: mocks.rpc },
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

function setupAtomicTransition(error?: string) {
  mocks.rpc.mockResolvedValue({ error: error ? { message: error } : null });
}

function setupNotes(error?: string) {
  const insert = vi.fn().mockResolvedValue({ error: error ? { message: error } : null });
  mocks.from.mockImplementation((table: string) => {
    if (table === "request_notes") return { insert };
    throw new Error(`Unexpected table: ${table}`);
  });
  return { insert };
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
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("reports an atomic transition failure without any separate timeline write", async () => {
    setupAtomicTransition("Transition unavailable");

    const result = await advanceRequest(request, "in_progress", staff);

    expect(result).toEqual({ error: "Transition unavailable", updated: false });
    expect(mocks.rpc).toHaveBeenCalledWith("advance_request", {
      p_request_id: "request-1",
      p_next_status: "in_progress",
      p_author_staff_id: "staff-1",
      p_author_name: "Jordan",
      p_note: null,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("submits status, attribution, and a trimmed note in one atomic operation", async () => {
    setupAtomicTransition();

    const result = await advanceRequest(request, "in_progress", staff, "  Sent a runner.  ");

    expect(result).toEqual({ error: null, updated: true });
    expect(mocks.rpc).toHaveBeenCalledWith("advance_request", {
      p_request_id: "request-1",
      p_next_status: "in_progress",
      p_author_staff_id: "staff-1",
      p_author_name: "Jordan",
      p_note: "Sent a runner.",
    });
  });

  it("rejects blank or too-short notes without calling the database", async () => {
    const result = await addRequestNote("request-1", " ", staff);

    expect(result).toEqual({ error: "A request note must contain at least two characters." });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("trims and saves valid standalone notes", async () => {
    const { insert } = setupNotes();

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

import { supabase } from "@/integrations/supabase/client";
import type { StaffIdentity } from "@/lib/ops";

export const REQUEST_STATUSES = ["new", "in_progress", "done"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  done: "Resolved",
};

export const NEXT_REQUEST_STATUS: Record<string, RequestStatus | null> = {
  new: "in_progress",
  in_progress: "done",
  done: null,
};

export const NEXT_REQUEST_ACTION: Record<string, string> = {
  new: "Start",
  in_progress: "Resolve",
};

export type WorkflowRequest = {
  id: string;
  status: string;
  created_at: string;
  started_at?: string | null;
  started_by_name?: string | null;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
};

export type RequestNote = {
  id: string;
  request_id: string;
  body: string | null;
  status_from: string | null;
  status_to: string | null;
  author_name: string | null;
  created_at: string;
};

/** Timestamps written when a request moves into a given status. */
export function statusPatch(
  next: string,
  current: WorkflowRequest,
  staff: StaffIdentity,
) {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: next };

  if (next === "in_progress") {
    patch['started_at'] = current.started_at ?? now;
    patch['started_by_staff_id'] = current.started_at
      ? undefined
      : (staff?.id ?? null);
    patch['started_by_name'] = current.started_at ? undefined : (staff?.name ?? null);
    patch['resolved_at'] = null;
    patch['resolved_by_staff_id'] = null;
    patch['resolved_by_name'] = null;
    patch['response_seconds'] = null;
  } else if (next === "done") {
    patch['resolved_at'] = now;
    patch['resolved_by_staff_id'] = staff?.id ?? null;
    patch['resolved_by_name'] = staff?.name ?? null;
    patch['response_seconds'] = Math.max(
      0,
      Math.round((Date.now() - new Date(current.created_at).getTime()) / 1000),
    );
  } else {
    patch['started_at'] = null;
    patch['started_by_staff_id'] = null;
    patch['started_by_name'] = null;
    patch['resolved_at'] = null;
    patch['resolved_by_staff_id'] = null;
    patch['resolved_by_name'] = null;
    patch['response_seconds'] = null;
  }

  for (const key of Object.keys(patch)) {
    if (patch[key] === undefined) delete patch[key];
  }
  return patch;
}

/** Move a request through the workflow and log the change on its timeline. */
export async function advanceRequest(
  current: WorkflowRequest,
  next: string,
  staff: StaffIdentity,
  note?: string,
) {
  const patch = statusPatch(next, current, staff);
  const { error } = await supabase
    .from("requests")
    .update(patch)
    .eq("id", current.id);
  if (error) return { error: error.message };

  await supabase.from("request_notes").insert({
    request_id: current.id,
    body: note?.trim() ? note.trim() : null,
    status_from: current.status,
    status_to: next,
    author_staff_id: staff?.id ?? null,
    author_name: staff?.name ?? null,
  });

  return { error: null as string | null };
}

/** Add a free-text note without changing the status. */
export async function addRequestNote(
  requestId: string,
  body: string,
  staff: StaffIdentity,
) {
  const { error } = await supabase.from("request_notes").insert({
    request_id: requestId,
    body: body.trim(),
    author_staff_id: staff?.id ?? null,
    author_name: staff?.name ?? null,
  });
  return { error: error?.message ?? null };
}

export async function loadRequestNotes(requestId: string) {
  const { data, error } = await supabase
    .from("request_notes")
    .select("id, request_id, body, status_from, status_to, author_name, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return { notes: (data ?? []) as RequestNote[], error: error?.message ?? null };
}

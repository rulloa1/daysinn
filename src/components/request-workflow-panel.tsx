import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { StaffIdentity } from "@/lib/ops";
import {
  addRequestNote,
  advanceRequest,
  loadRequestNotes,
  NEXT_REQUEST_ACTION,
  NEXT_REQUEST_STATUS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABEL,
  type RequestNote,
  type WorkflowRequest,
} from "@/lib/request-workflow";

function stamp(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Status workflow (New -> In progress -> Resolved) with the timestamp for each
 * step plus the shared note timeline. Used by the staff queue, the front-desk
 * room panel and the housekeeping room sheet.
 */
export function RequestWorkflowPanel({
  request,
  canEdit,
  staff,
  defaultOpen = false,
}: {
  request: WorkflowRequest;
  canEdit: boolean;
  staff: StaffIdentity;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [notes, setNotes] = useState<RequestNote[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void loadRequestNotes(request.id).then(({ notes: rows }) => {
      if (active) setNotes(rows);
    });
    const channel = supabase
      .channel(`request-notes-${request.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_notes",
          filter: `request_id=eq.${request.id}`,
        },
        () =>
          void loadRequestNotes(request.id).then(({ notes: rows }) => {
            if (active) setNotes(rows);
          }),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [open, request.id]);

  const next = NEXT_REQUEST_STATUS[request.status] ?? null;

  async function move(status: string) {
    setBusy(true);
    const { error } = await advanceRequest(request, status, staff, draft);
    setBusy(false);
    if (error) {
      toast.error("Update failed — your role may not allow this.");
      return;
    }
    setDraft("");
    toast.success(`Marked ${REQUEST_STATUS_LABEL[status]?.toLowerCase()}.`);
  }

  async function saveNote() {
    if (draft.trim().length < 2) {
      toast.error("Write a short note first.");
      return;
    }
    setBusy(true);
    const { error } = await addRequestNote(request.id, draft, staff);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save that note.");
      return;
    }
    setDraft("");
    toast.success("Note added.");
  }

  return (
    <div className="mt-3 border-t border-cream/10 pt-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cream/55">
        <span>Opened {stamp(request.created_at)}</span>
        <span>
          Started {stamp(request.started_at)}
          {request.started_by_name ? ` · ${request.started_by_name}` : ""}
        </span>
        <span>
          Resolved {stamp(request.resolved_at)}
          {request.resolved_by_name ? ` · ${request.resolved_by_name}` : ""}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="signage mt-2 text-cream/60 underline-offset-4 transition-colors duration-200 hover:text-amber hover:underline"
      >
        {open ? "Hide notes" : "Notes & timeline"}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          <ul className="max-h-48 space-y-2 overflow-y-auto pr-1 text-xs">
            {notes.length === 0 ? (
              <li className="text-cream/45">No notes yet.</li>
            ) : (
              notes.map((note) => (
                <li
                  key={note.id}
                  className="border border-cream/10 bg-cream/[0.03] px-3 py-2"
                >
                  <p className="text-cream/45">
                    {stamp(note.created_at)}
                    {note.author_name ? ` · ${note.author_name}` : ""}
                    {note.status_to
                      ? ` · ${REQUEST_STATUS_LABEL[note.status_from ?? ""] ?? note.status_from ?? "—"} → ${REQUEST_STATUS_LABEL[note.status_to] ?? note.status_to}`
                      : ""}
                  </p>
                  {note.body ? (
                    <p className="mt-1 text-sm text-cream/85">{note.body}</p>
                  ) : null}
                </li>
              ))
            )}
          </ul>

          {canEdit ? (
            <div className="space-y-2">
              <Textarea
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a note (saved with the next status change too)…"
                className="border-cream/20 bg-cream/[0.04] text-sm text-cream placeholder:text-cream/35"
              />
              <div className="flex flex-wrap gap-2">
                {next ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    className="bg-amber text-ink hover:bg-amber/90"
                    onClick={() => void move(next)}
                  >
                    {NEXT_REQUEST_ACTION[request.status] ?? "Advance"}
                  </Button>
                ) : null}
                {REQUEST_STATUSES.filter(
                  (s) => s !== request.status && s !== next,
                ).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="border-cream/25 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                    onClick={() => void move(s)}
                  >
                    {REQUEST_STATUS_LABEL[s]}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  className="text-cream/70 hover:bg-cream/10 hover:text-cream"
                  onClick={() => void saveNote()}
                >
                  Save note
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StaffIdentity } from "@/lib/ops";
import type { RoomRow } from "./types";

const ISSUE_TYPES = [
  { value: "maintenance", label: "Maintenance / repair" },
  { value: "supplies", label: "Supplies needed" },
  { value: "damage", label: "Damage or missing item" },
  { value: "front_desk", label: "Front desk follow-up" },
] as const;

/** Files a housekeeper-reported issue straight into the staff request queue. */
export function IssueDialog({
  room,
  staff,
  onClose,
}: {
  room: RoomRow | null;
  staff: NonNullable<StaffIdentity>;
  onClose: () => void;
}) {
  const [type, setType] = useState<string>("maintenance");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (room) {
      setType("maintenance");
      setDetails("");
    }
  }, [room]);

  async function submit() {
    if (!room) return;
    if (details.trim().length < 3) {
      toast.error("Add a short description of the issue.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("requests").insert({
      room: room.number,
      guest_name: `Housekeeping · ${staff.name}`,
      type,
      details: details.trim(),
      status: "new",
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't send that to the front desk.");
      return;
    }
    toast.success(`Issue sent for room ${room.number}`);
    onClose();
  }

  return (
    <Dialog open={!!room} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-cream/20 bg-ink text-cream">
        {room ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl">Report an issue</DialogTitle>
              <DialogDescription className="text-cream/60">
                Room {room.number} · goes straight to the staff request queue.
              </DialogDescription>
            </DialogHeader>

            <label className="signage block text-cream/50" htmlFor="issue-type">
              Type
            </label>
            <select
              id="issue-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-12 w-full border border-cream/25 bg-cream/[0.04] px-3 text-base text-cream"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="text-ink">
                  {t.label}
                </option>
              ))}
            </select>

            <label className="signage block text-cream/50" htmlFor="issue-details">
              What's wrong?
            </label>
            <Textarea
              id="issue-details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Shower drain is backing up; need two extra bath towels."
              className="border-cream/20 bg-cream/[0.04] text-base text-cream placeholder:text-cream/35"
            />

            <Button
              onClick={() => void submit()}
              disabled={busy}
              className="h-12 w-full bg-amber text-base text-ink hover:bg-amber/90"
            >
              {busy ? "Sending…" : "Send to front desk"}
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

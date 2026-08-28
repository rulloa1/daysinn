import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestSchema } from "@/lib/request-schema";
import type { GuestSession } from "@/lib/guest-session";
import type { RoomService } from "./content";

/**
 * In-room request form. Unlike the public page's version the room number comes
 * from the signed-in guest session and cannot be typed.
 */
export function ServiceRequestDialog({
  service,
  session,
  onClose,
  onSent,
}: {
  service: RoomService | null;
  session: GuestSession;
  onClose: () => void;
  onSent: () => void;
}) {
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!service) return;
    const parsed = requestSchema.safeParse({
      room: session.room,
      guest_name: session.guestName,
      details,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("requests").insert({
      room: parsed.data.room,
      guest_name: parsed.data.guest_name || null,
      type: service.label,
      details: parsed.data.details || null,
    });
    setSending(false);
    if (error) {
      toast.error("We couldn't send that. Please call the front desk.");
      return;
    }
    toast.success("Sent. We're routing it now.", {
      description: "Our staff is on it and will follow up shortly.",
    });
    setDetails("");
    onClose();
    onSent();
  }

  return (
    <Dialog open={service !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="glass-panel max-w-md border-border/90 bg-card/95 p-6 backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-foreground">
                {service?.label}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {service?.prompt}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="room-locked" className="text-xs font-semibold text-foreground">
              Your Assigned Room
            </Label>
            <Input
              id="room-locked"
              value={`Room ${session.room} (${session.guestName})`}
              readOnly
              disabled
              className="rounded-xl border-border bg-muted/60 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room-details" className="text-xs font-semibold text-foreground">
              Special Details or Timing
            </Label>
            <Textarea
              id="room-details"
              value={details}
              maxLength={1000}
              rows={3}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Let us know how many items, preferred timing, or special notes..."
              className="rounded-xl border-border bg-background/80 text-xs"
            />
          </div>

          <Button
            type="submit"
            className="spring-hover w-full rounded-xl bg-accent font-bold text-accent-foreground shadow-md hover:brightness-105"
            disabled={sending}
          >
            {sending ? "Routing request…" : "Send request now"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

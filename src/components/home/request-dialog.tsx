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
import type { ServiceRequest } from "./content";

/** Guest-facing form that files a service request against a room number. */
export function RequestDialog({
  request,
  onClose,
}: {
  request: ServiceRequest | null;
  onClose: () => void;
}) {
  const [room, setRoom] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!request) return;
    const parsed = requestSchema.safeParse({ room, guest_name: name, details });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message = issue?.message ?? "Please check your details.";
      if (issue?.path[0] === "room") setRoomError(message);
      toast.error(message);
      return;
    }
    setRoomError(null);
    setSending(true);
    const { error } = await supabase.from("requests").insert({
      room: parsed.data.room,
      guest_name: parsed.data.guest_name || null,
      type: request.label,
      details: parsed.data.details || null,
    });
    setSending(false);
    if (error) {
      // 23514 is the room-number check constraint on `requests`.
      if (error.code === "23514") {
        setRoomError("Enter a valid room number.");
        toast.error("Enter a valid room number.");
        return;
      }
      toast.error("We couldn't send that. Please call the front desk.");
      return;
    }
    toast.success("Sent. We're routing it now.", {
      description: "Our staff has been notified and will fulfill your request promptly.",
    });
    setDetails("");
    onClose();
  }

  return (
    <Dialog open={request !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="glass-panel max-w-md border-border/90 bg-card/95 p-6 backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-foreground">
                {request?.label}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {request?.prompt}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="room" className="text-xs font-semibold text-foreground">
                Room Number *
              </Label>
              <Input
                id="room"
                value={room}
                placeholder="e.g. 214"
                maxLength={10}
                aria-invalid={roomError ? true : undefined}
                aria-describedby={roomError ? "room-error" : undefined}
                onChange={(event) => {
                  setRoom(event.target.value);
                  if (roomError) setRoomError(null);
                }}
                className="rounded-xl border-border bg-background/80"
                required
              />
              {roomError ? (
                <p id="room-error" className="text-[11px] font-medium text-destructive">
                  {roomError}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                Guest Name (Optional)
              </Label>
              <Input
                id="name"
                value={name}
                maxLength={80}
                placeholder="e.g. Smith"
                onChange={(event) => setName(event.target.value)}
                className="rounded-xl border-border bg-background/80"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="details" className="text-xs font-semibold text-foreground">
              Specific Requests or Details
            </Label>
            <Textarea
              id="details"
              value={details}
              maxLength={1000}
              rows={3}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Let us know how many items, preferred timing, or special notes..."
              className="rounded-xl border-border bg-background/80"
            />
          </div>

          <Button
            type="submit"
            className="spring-hover w-full rounded-xl bg-accent font-bold text-accent-foreground shadow-md hover:brightness-105"
            disabled={sending}
          >
            {sending ? "Routing request…" : "Send to front desk"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

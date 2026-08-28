import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clearDoorPin, issueDoorPin, readDoorPin } from "@/lib/guest-hub.functions";

/**
 * Issue, re-issue and clear the digital door PIN for a room. The PIN is never
 * part of the client's room table read — it is fetched through a staff-gated
 * server function whenever the panel opens.
 */
export function RoomKeyPanel({ room, canEdit }: { room: string; canEdit: boolean }) {
  const [pin, setPin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mintKey = useServerFn(issueDoorPin);
  const loadKey = useServerFn(readDoorPin);
  const revokeKey = useServerFn(clearDoorPin);

  useEffect(() => {
    setPin(null);
    if (!room) return;
    let active = true;
    void loadKey({ data: { room } })
      .then((res) => {
        if (active) setPin(res.pin);
      })
      .catch(() => {
        if (active) setPin(null);
      });
    return () => {
      active = false;
    };
  }, [room, loadKey]);

  async function issue() {
    setBusy(true);
    try {
      const result = await mintKey({ data: { room } });
      setPin(result.pin);
      toast.success(`Room key issued for ${room}.`);
    } catch {
      toast.error("Could not issue a room key.");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    try {
      await revokeKey({ data: { room } });
      setPin(null);
      toast.success(`Room key cleared for ${room}.`);
    } catch {
      toast.error("Could not clear the room key.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="signage text-amber">Digital room key</p>
      <p className="mt-2 font-display text-2xl tracking-[0.3em] tabular-nums">
        {pin ?? "— — — — — —"}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!canEdit || busy}
          onClick={() => void issue()}
          className="bg-amber text-ink hover:bg-amber/90"
        >
          {pin ? "Re-issue PIN" : "Issue PIN"}
        </Button>
        {pin ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canEdit || busy}
            onClick={() => void clear()}
            className="border-cream/25 bg-transparent text-cream hover:bg-cream/10"
          >
            Clear
          </Button>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-cream/55">
        The guest sees this instantly in their room portal.
      </p>
    </div>
  );
}

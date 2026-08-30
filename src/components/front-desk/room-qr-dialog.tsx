import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode } from "@/components/qr-code";
import { revokeRoomQr, rotateRoomQr } from "@/lib/guest.functions";
import { guestCheckinUrl } from "@/lib/site";
import type { RoomRow } from "./types";

/**
 * Issues the single-use guest sign-in code for a room. The code is burned on
 * first use and expires on its own, so a screenshot of an old scan is useless.
 */
export function RoomQrDialog({ room, onClose }: { room: RoomRow | null; onClose: () => void }) {
  const rotate = useServerFn(rotateRoomQr);
  const revoke = useServerFn(revokeRoomQr);
  const [state, setState] = useState<{ url: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const number = room?.number ?? null;

  const issue = useCallback(
    async (roomNumber: string) => {
      setBusy(true);
      try {
        const result = await rotate({ data: { room: roomNumber } });
        setState({
          url: guestCheckinUrl(roomNumber, result.token),
          expiresAt: result.expiresAt,
        });
      } catch {
        toast.error("Could not issue a sign-in code.");
        setState(null);
      } finally {
        setBusy(false);
      }
    },
    [rotate],
  );

  useEffect(() => {
    setState(null);
    if (number) void issue(number);
  }, [number, issue]);

  useEffect(() => {
    if (!state) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  const msLeft = state ? Date.parse(state.expiresAt) - now : 0;
  const expired = state !== null && msLeft <= 0;
  const countdown = (() => {
    const total = Math.max(0, Math.floor(msLeft / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  })();

  return (
    <Dialog open={room !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Room {room?.number} sign-in</DialogTitle>
          <DialogDescription>
            Single-use code. It expires on its own and is burned the moment the guest signs in, so
            an old scan or screenshot won't work later.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {state && !expired ? (
            <>
              <QrCode value={state.url} size={220} alt={`Sign-in QR for room ${room?.number}`} />
              <p className="signage text-amber">Expires in {countdown}</p>
              <p className="break-all text-center text-xs text-muted-foreground">{state.url}</p>
            </>
          ) : (
            <p className="py-10 text-sm text-muted-foreground">
              {busy
                ? "Issuing a fresh code…"
                : expired
                  ? "This code expired. Generate a new one."
                  : "No active code."}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !room}
              onClick={() => room && void issue(room.number)}
            >
              {state ? "New code" : "Generate code"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !room || !state}
              onClick={async () => {
                if (!room) return;
                setBusy(true);
                try {
                  await revoke({ data: { room: room.number } });
                  setState(null);
                  toast.success("Codes for this room are revoked.");
                } catch {
                  toast.error("Could not revoke codes.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Revoke
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!state || expired}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

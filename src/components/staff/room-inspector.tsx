import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { MapRoom } from "@/components/floor-plan";
import type { RequestRow } from "./types";

/** Side panel for a room picked off the property map. */
export function RoomInspector({
  room,
  requests,
  onClose,
}: {
  room: MapRoom | null;
  requests: RequestRow[];
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(room)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[90vw] max-w-md border-cream/15 bg-ink text-cream">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between text-left text-cream">
            <span>Room {room?.number}</span>
            {room ? (
              <Badge className="bg-amber font-mono text-[10px] uppercase text-ink">
                {room.status.replace("_", " ")}
              </Badge>
            ) : null}
          </SheetTitle>
        </SheetHeader>

        {room ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-cream/15 bg-cream/[0.04] p-4">
              <p className="text-xs uppercase tracking-wider text-cream/50">Current Guest</p>
              <p className="mt-1 font-serif text-lg font-bold text-cream">
                {room.guest_name ?? "No guest registered"}
              </p>
            </div>

            <div>
              <h3 className="signage mb-2 text-xs uppercase tracking-wider text-cream/60">
                Open Requests ({requests.length})
              </h3>
              {requests.length === 0 ? (
                <p className="text-sm italic text-cream/40">
                  No open requests for room {room.number}.
                </p>
              ) : (
                <ul className="space-y-2">
                  {requests.map((req) => (
                    <li
                      key={req.id}
                      className="rounded-lg border border-cream/15 bg-cream/[0.03] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-cream">{req.type}</span>
                        <Badge className="bg-amber/20 text-[10px] text-amber">{req.status}</Badge>
                      </div>
                      {req.details ? (
                        <p className="mt-1 text-xs text-cream/70">{req.details}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-cream/10 pt-4">
              <Button
                asChild
                variant="outline"
                className="w-full border-cream/20 text-cream hover:bg-cream/10"
              >
                <Link to="/front-desk">Open Front Desk Board →</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-cream/20 text-cream hover:bg-cream/10"
              >
                <Link to="/housekeeping">Open Housekeeping Board →</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

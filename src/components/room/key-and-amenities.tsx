import { KeyRound, Wifi } from "lucide-react";

/** Digital door PIN, when the desk has issued one, plus the standing house info. */
export function KeyAndAmenities({ room, pin }: { room: string; pin: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/95 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-200">
            <KeyRound className="h-3.5 w-3.5" /> Digital Room Key
          </span>
          <span className="text-xs font-semibold text-slate-300">Room {room}</span>
        </div>

        {pin ? (
          <div className="mt-5 text-center">
            <p className="signage text-slate-300">Electronic Keypad PIN</p>
            <p className="my-2 font-mono text-5xl font-extrabold tracking-[0.25em] text-accent">
              {pin}
            </p>
            <p className="text-xs text-slate-300">
              Enter on room door keypad. Valid through checkout.
            </p>
          </div>
        ) : (
          <div className="my-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs text-slate-200">
              Physical keycard active. Front desk can issue an electronic PIN code on request.
            </p>
          </div>
        )}
      </section>

      <section className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 font-bold text-primary">
          <Wifi className="h-4 w-4" />
          <h3 className="font-serif text-base">In-Room Amenities & Wi-Fi</h3>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          <p className="flex justify-between border-b border-border/60 pb-1.5">
            <span className="text-muted-foreground">Network</span>
            <strong className="text-foreground">DaysInn_Guest</strong>
          </p>
          <p className="flex justify-between border-b border-border/60 pb-1.5">
            <span className="text-muted-foreground">Breakfast Hours</span>
            <strong className="text-foreground">6:00 AM – 9:30 AM</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Pool & Sun Deck</span>
            <strong className="text-foreground">9:00 AM – 10:00 PM</strong>
          </p>
        </div>
      </section>
    </div>
  );
}

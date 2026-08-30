import { BellOff, BellRing } from "lucide-react";

type Props = {
  active: boolean;
  busy: boolean;
  onToggle: (next: boolean) => void;
};

/** Guest-facing Do Not Disturb sign; mirrors instantly to the staff boards. */
export function DndToggle({ active, busy, onToggle }: Props) {
  return (
    <div
      className={`glass-card flex items-center justify-between gap-4 rounded-2xl p-4 ${
        active ? "border-accent/60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl ${
            active ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
          }`}
        >
          {active ? <BellOff className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-serif text-sm font-bold text-foreground">Do Not Disturb</p>
          <p className="text-[11px] text-muted-foreground">
            {active
              ? "Housekeeping and the front desk can see your sign is up."
              : "Turn this on to hold housekeeping and in-room visits."}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label="Do Not Disturb"
        disabled={busy}
        onClick={() => onToggle(!active)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          active ? "bg-accent" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-background shadow transition-all ${
            active ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

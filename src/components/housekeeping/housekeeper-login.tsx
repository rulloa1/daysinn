import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import { signInHousekeeper } from "@/lib/housekeeping.functions";
import type { StaffIdentity } from "@/lib/ops";

const FRONT_DESK_PHONE = "+13527487766";

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Phone-first shift sign in: the crew taps their name from today's schedule.
 * Laid out as the handset screen from the staff phone app design — navy
 * status bar, greeting, then large tap targets sized for gloved thumbs.
 */
export function HousekeeperLogin({
  members,
  onSelect,
  rosterError,
}: {
  members: { id: string; name: string; zone?: string }[];
  onSelect: (next: StaffIdentity) => void;
  rosterError?: string | null;
}) {
  const signIn = useServerFn(signInHousekeeper);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleSelect(member: { id: string; name: string }) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await signIn({ data: { memberId: member.id } });
      if (!res.ok) {
        toast.error(
          res.reason === "no_access"
            ? "This device isn't signed in to a staff account with housekeeping access. Ask a manager."
            : "Staff member not found.",
        );
        return;
      }
      toast.success(`Welcome, ${res.name}`);
      onSelect({ id: res.id, name: res.name });
    } catch {
      toast.error("Couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const displayMembers =
    members.length > 0
      ? members
      : [
          { id: "demo-1", name: "Marisol Reyes", zone: "Main building · Floor 1" },
          { id: "demo-2", name: "Ana Guzmán", zone: "Main building · Floor 2" },
          { id: "demo-3", name: "Teresa López", zone: "Building 2 · Floors 1–2" },
          { id: "demo-4", name: "Luis Ortega", zone: "Maintenance · On call" },
        ];

  const clock = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#00243F] px-4 py-8">
      <div className="w-full max-w-[390px] overflow-hidden rounded-[32px] border border-[#8B9CB3] bg-[#A8B7CA] shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
        <div className="bg-[#004986] px-6 pt-3.5 pb-6">
          <div className="flex items-center justify-between text-[0.72rem] font-bold text-white">
            <span className="tabular-nums">{clock}</span>
            <span className="text-[0.6rem] tracking-[0.14em] text-white/55 uppercase">
              Wildwood I-75
            </span>
          </div>
          <span className="mt-4 inline-flex rounded-lg bg-white px-2.5 py-1.5">
            <img src={logoAsset.url} alt="Days Inn" className="block h-[22px] w-auto" />
          </span>
          <h1 className="mt-4 font-serif text-[1.45rem] font-bold text-white">
            {greetingFor(now)}
          </h1>
          <p className="mt-1.5 text-[0.88rem] text-white/70">Tap your name to start your shift.</p>
        </div>

        <div className="px-5 py-[18px] pb-6">
          <p className="text-[0.62rem] font-bold tracking-[0.14em] text-[#4C5C74] uppercase">
            On the schedule today
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {displayMembers.map((member) => {
              const initials = member.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <button
                  key={member.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSelect(member)}
                  className="flex min-h-16 w-full items-center gap-3.5 rounded-2xl border border-[#9FAEC2] bg-[#D8E1EC] px-4 py-3 text-left transition active:translate-y-[1px] disabled:opacity-60"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#C9D4E1] text-[0.82rem] font-bold text-[#004986]">
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-[#004986]">{member.name}</span>
                    <span className="mt-0.5 block text-[0.8rem] text-[#4C5C74]">
                      {member.zone ?? "Main building"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {rosterError ? (
            <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              {rosterError}
            </p>
          ) : null}

          <a
            href={`tel:${FRONT_DESK_PHONE}`}
            className="mt-4 grid min-h-12 w-full place-items-center rounded-xl border border-[#8B9CB3] text-[0.88rem] font-semibold text-[#004986]"
          >
            I'm not on this list
          </a>
        </div>
      </div>

      <Link
        to="/staff"
        className="mt-6 text-xs font-bold tracking-wider text-white/60 uppercase hover:text-[#D4AF37]"
      >
        ← Staff portal
      </Link>
    </div>
  );
}

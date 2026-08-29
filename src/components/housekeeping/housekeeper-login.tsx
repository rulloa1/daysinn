import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import { signInHousekeeper } from "@/lib/housekeeping.functions";
import type { StaffIdentity } from "@/lib/ops";

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

  // Fallback demo crew if database roster is empty
  const displayMembers =
    members.length > 0
      ? members
      : [
          { id: "demo-1", name: "Marisol Reyes", zone: "Main building · Floor 1" },
          { id: "demo-2", name: "Ana Guzmán", zone: "Main building · Floor 2" },
          { id: "demo-3", name: "Teresa López", zone: "Building 2 · Floors 1–2" },
          { id: "demo-4", name: "Luis Ortega", zone: "Maintenance · On call" },
        ];

  // Name Picker Screen
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEF2F7] px-4 py-8 text-slate-800">
      <div className="flex w-full max-w-sm flex-col">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex w-16 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
            <img src={logoAsset.url} alt="Days Inn" className="h-auto w-full object-contain" />
          </div>
          <p className="mt-4 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Housekeeping · Shift sign in
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#004986]">Good morning</h1>
          <p className="mt-1 text-xs text-slate-500">Tap your name to start your shift</p>
        </div>

        {/* Schedule List */}
        <div className="mt-6 flex flex-col gap-2.5">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            On the schedule today
          </p>

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
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#004986] hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-mono text-sm font-bold text-[#004986]">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.zone ?? "Main building"}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-[#004986]">
                  Sign in →
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

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <button
            type="button"
            onClick={() => toast.info("Please call the front desk for schedule adjustments.")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            I'm not on this list
          </button>
          <Link to="/staff" className="text-xs font-bold text-[#004986] hover:underline">
            ← Staff portal
          </Link>
        </div>
      </div>
    </div>
  );
}

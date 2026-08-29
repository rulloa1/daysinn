import { useNavigate } from "@tanstack/react-router";
import type { StaffIdentity, StaffMember } from "@/lib/ops";

const HOUSEKEEPING_KEY = "daysinn.housekeeping.identity";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function departmentLabel(department?: string) {
  if (department === "housekeeping") return "Housekeeping · Room route";
  if (department === "maintenance") return "Maintenance · On call";
  return "Front desk · Operations";
}

/**
 * Shown right after staff sign in: pick who is working this device, then land
 * on the workflow that matches that person's department.
 */
export function StaffNamePicker({
  members,
  onSelect,
  rosterError,
  onSkip,
}: {
  members: StaffMember[];
  onSelect: (next: StaffIdentity) => void;
  rosterError?: string | null;
  onSkip: () => void;
}) {
  const navigate = useNavigate();

  function choose(member: StaffMember) {
    onSelect({ id: member.id, name: member.name });
    if (member.department === "housekeeping") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          HOUSEKEEPING_KEY,
          JSON.stringify({ id: member.id, name: member.name }),
        );
      }
      void navigate({ to: "/housekeeping" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEF2F7] px-4 py-8 text-slate-800">
      <div className="flex w-full max-w-sm flex-col">
        <div className="flex flex-col items-center text-center">
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Signed in · Who's working?
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#004986]">Choose your name</h1>
          <p className="mt-1 text-xs text-slate-500">
            We'll open the workflow that matches your role
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {members.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              No one is on the roster yet. Continue to the dashboard and add staff from the Team
              tab.
            </p>
          ) : null}

          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => choose(member)}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#004986] hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-mono text-sm font-bold text-[#004986]">
                  {initials(member.name)}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-400">{departmentLabel(member.department)}</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-[#004986]">
                Start →
              </span>
            </button>
          ))}
        </div>

        {rosterError ? (
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            {rosterError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onSkip}
          className="mt-8 text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Skip — open the front desk dashboard
        </button>
      </div>
    </div>
  );
}

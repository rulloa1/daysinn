import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shield, Key, AlertTriangle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listTeam,
  setTeamRole,
  revokeTeamRole,
  type AppRole,
  type TeamMember,
} from "@/lib/roles.functions";
import { forceStaffPasswordReset } from "@/lib/password-policy.functions";

const ROLES: AppRole[] = ["manager", "staff", "housekeeper", "viewer"];
const ROLE_LABEL: Record<AppRole, string> = {
  manager: "Manager",
  staff: "Front Desk",
  housekeeper: "Housekeeping",
  viewer: "Viewer",
};

export function TeamPanel() {
  const fetchTeam = useServerFn(listTeam);
  const assignRole = useServerFn(setTeamRole);
  const revokeRole = useServerFn(revokeTeamRole);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const forceReset = useServerFn(forceStaffPasswordReset);
  const [resetting, setResetting] = useState(false);

  async function forceResetAll() {
    if (
      !window.confirm(
        "Require every team member to set a new password on next sign in? Reset emails go out immediately.",
      )
    )
      return;
    setResetting(true);
    try {
      const result = await forceReset({ data: undefined });
      toast.success(`${result.flagged} account(s) flagged, ${result.emailed} reset email(s) sent.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't start the password reset.");
    }
    setResetting(false);
  }

  const load = useCallback(async () => {
    try {
      const result = await fetchTeam({ data: undefined });
      if (!result.ok) {
        setMembers([]);
        setLoadError(
          result.reason === "authentication_required"
            ? "Your staff session expired. Sign in again to manage the team."
            : "Manager access is required to manage the team.",
        );
        return;
      }
      setMembers(result.members);
      setLoadError(null);
    } catch (error) {
      const requiresSignIn =
        error instanceof Error &&
        (error.message.includes("Authentication required") ||
          error.message.includes("Unauthorized"));
      const message = requiresSignIn
        ? "Your staff session expired. Sign in again to manage the team."
        : "Couldn't load the team list.";
      setLoadError(message);
      toast.error(message);
    }
  }, [fetchTeam]);

  useEffect(() => {
    void load();
  }, [load]);

  async function change(userId: string, role: AppRole) {
    setBusy(userId);
    try {
      await assignRole({ data: { userId, role } });
      toast.success(`Role set to ${ROLE_LABEL[role]}.`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update that role.");
    }
    setBusy(null);
  }

  async function revoke(userId: string) {
    setBusy(userId);
    try {
      await revokeRole({ data: { userId } });
      toast.success("Access revoked.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't revoke that role.");
    }
    setBusy(null);
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Security & Password Policy Action Box */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7EDF5] text-[#004986]">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Enforce Password Policy &amp; Resets</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Flags staff accounts for a secure password reset on their next sign-in.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          disabled={resetting}
          onClick={forceResetAll}
          className="rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#004986] shadow-2xs hover:bg-slate-50"
        >
          {resetting ? "Sending resets…" : "Reset all passwords"}
        </Button>
      </div>

      {/* Team Roster & Permissions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#004986]">
              Property Roster &amp; Roles
            </h2>
            <p className="text-xs text-slate-500">
              Click a role button to adjust member privileges in real time.
            </p>
          </div>
          <span className="rounded-full bg-[#E7EDF5] px-3 py-1 text-xs font-bold text-[#004986]">
            {members.length} members
          </span>
        </div>

        {loadError ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <span>{loadError}</span>
            <Button size="sm" variant="outline" onClick={load}>
              Try again
            </Button>
          </div>
        ) : null}

        <ul className="divide-y divide-slate-100">
          {members.map((member) => {
            const current = member.roles[0] as AppRole | undefined;
            return (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-mono text-xs font-bold text-[#004986]">
                    {member.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{member.email}</p>
                    <Badge
                      className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${
                        current === "manager"
                          ? "bg-[#D4AF37] text-[#004986]"
                          : current === "staff"
                            ? "bg-[#004986] text-white"
                            : current === "housekeeper"
                              ? "bg-[#0F7B4F] text-white"
                              : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {current ? ROLE_LABEL[current] : "No Role"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ROLES.map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant="outline"
                      disabled={busy === member.id || current === role}
                      className={`h-8 rounded-lg text-xs font-bold transition ${
                        current === role
                          ? "border-[#004986] bg-[#004986] text-white shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      onClick={() => change(member.id, role)}
                    >
                      {ROLE_LABEL[role]}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === member.id || !current}
                    className="h-8 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => revoke(member.id)}
                  >
                    Revoke
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

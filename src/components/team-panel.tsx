import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
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
  staff: "Staff",
  viewer: "Viewer",
};

export function TeamPanel() {
  const fetchTeam = useServerFn(listTeam);
  const assignRole = useServerFn(setTeamRole);
  const revokeRole = useServerFn(revokeTeamRole);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
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

  async function load() {
    try {
      setMembers(await fetchTeam({ data: undefined }));
    } catch {
      toast.error("Couldn't load the team list.");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <section className="mt-12 border border-cream/15 bg-cream/[0.04] p-6">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        Permissions
      </p>
      <h2 className="mt-3 font-display text-2xl">Team access</h2>
      <p className="mt-2 max-w-2xl text-sm text-cream/60">
        Managers grant and revoke roles. Staff and managers can triage the queue; viewers can only
        watch it. Revoked members keep no access until a role is granted again.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 border border-cream/15 bg-ink/40 p-4">
        <div className="min-w-[14rem] flex-1">
          <p className="text-sm">Force a password reset</p>
          <p className="mt-1 text-xs text-cream/55">
            Flags every account with a role and emails a reset link. Breached and weak passwords are
            now blocked at sign-up and reset.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={resetting}
          className="border-amber/60 bg-transparent text-cream hover:bg-amber/15 hover:text-cream"
          onClick={forceResetAll}
        >
          {resetting ? "Working…" : "Reset all staff passwords"}
        </Button>
      </div>

      <ul className="mt-6 divide-y divide-cream/10">
        {members.map((member) => {
          const current = member.roles[0] as AppRole | undefined;
          return (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm">{member.email}</p>
                <Badge className="mt-2 bg-cream/15 text-cream">
                  {current ? ROLE_LABEL[current] : "No access"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <Button
                    key={role}
                    size="sm"
                    variant="outline"
                    disabled={busy === member.id || current === role}
                    className={
                      current === role
                        ? "border-amber bg-amber text-ink"
                        : "border-cream/25 bg-transparent text-cream/80 hover:bg-cream/10 hover:text-cream"
                    }
                    onClick={() => change(member.id, role)}
                  >
                    {ROLE_LABEL[role]}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === member.id || !current}
                  className="border-clay/50 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                  onClick={() => revoke(member.id)}
                >
                  Revoke
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

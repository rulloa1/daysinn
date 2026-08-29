import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  listStaffInvites,
  sendStaffInvite,
  revokeStaffInvite,
  type AppRole,
  type StaffInvite,
} from "@/lib/invites.functions";

const SUGGESTED = ["Michael", "Rory"];

const ROLE_LABEL: Record<AppRole, string> = {
  manager: "Manager",
  staff: "Staff",
  viewer: "Viewer",
  housekeeper: "Housekeeper",
};

function when(value: string | null) {
  if (!value) return "never";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InvitePanel() {
  const fetchInvites = useServerFn(listStaffInvites);
  const send = useServerFn(sendStaffInvite);
  const revoke = useServerFn(revokeStaffInvite);

  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("staff");

  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    try {
      const result = await fetchInvites({ data: undefined });
      if (result.ok) {
        setInvites(result.invites);
        setNotice(null);
        return;
      }
      setInvites([]);
      setNotice(
        result.reason === "forbidden"
          ? "Manager access is required to view staff invitations."
          : "Your staff session expired. Sign in again to manage invitations.",
      );
    } catch {
      toast.error("Couldn't load invitations.");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function dispatch(
    payload: { name: string; email: string; role: AppRole; inviteId?: string },
    label: string,
  ) {
    setBusy(label);
    try {
      const result = await send({ data: payload });
      if (result.link) {
        setLinks((prev) => ({ ...prev, [result.inviteId]: result.link! }));
      }
      if (result.emailSent) {
        toast.success(`Invitation emailed to ${payload.email}.`);
      } else {
        toast.message("Invite link ready", {
          description:
            result.emailError ?? "Email isn't set up yet — copy the link and send it directly.",
        });
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send that invite.");
    }
    setBusy(null);
  }

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.");
    }
  }

  return (
    <section className="mt-8 border border-cream/15 bg-cream/[0.04] p-6">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        Invitations
      </p>
      <h2 className="mt-3 font-display text-2xl">Invite staff to log in</h2>
      <p className="mt-2 max-w-2xl text-sm text-cream/60">
        Send a login invitation by email, or copy the secure link and hand it to the person
        directly. Links expire after 7 days; resending issues a fresh one and cancels the old.
      </p>

      {notice ? (
        <p className="mt-4 border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-cream/80">
          {notice}
        </p>
      ) : null}

      <form
        className="mt-5 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !email.trim()) {
            toast.error("Name and email are both required.");
            return;
          }
          void dispatch({ name, email, role }, "new").then(() => {
            setName("");
            setEmail("");
          });
        }}
      >
        <div className="min-w-[9rem] flex-1">
          <label className="signage text-cream/50" htmlFor="invite-name">
            Name
          </label>
          <Input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Michael"
            className="mt-1 border-cream/20 bg-ink/40 text-cream"
          />
        </div>
        <div className="min-w-[12rem] flex-[2]">
          <label className="signage text-cream/50" htmlFor="invite-email">
            Email
          </label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="michael@daysinnwildwood.com"
            className="mt-1 border-cream/20 bg-ink/40 text-cream"
          />
        </div>
        <div>
          <label className="signage text-cream/50" htmlFor="invite-role">
            Access
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
            className="mt-1 block h-9 border border-cream/20 bg-ink/40 px-2 text-sm text-cream"
          >
            <option value="staff">Staff</option>
            <option value="housekeeper">Housekeeper</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <Button
          type="submit"
          disabled={busy === "new"}
          className="bg-amber text-ink hover:bg-amber/90"
        >
          {busy === "new" ? "Sending…" : "Send invitation"}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-cream/50">
        <span>Quick fill:</span>
        {SUGGESTED.map((person) => (
          <button
            key={person}
            type="button"
            className="border border-cream/20 px-2 py-1 text-cream/70 hover:bg-cream/10"
            onClick={() => setName(person)}
          >
            {person}
          </button>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-cream/10">
        {invites.length === 0 && (
          <li className="py-4 text-sm text-cream/50">No invitations yet.</li>
        )}
        {invites.map((invite) => (
          <li key={invite.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm">
                  {invite.name} <span className="text-cream/50">· {invite.email}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-cream/15 text-cream">{ROLE_LABEL[invite.role]}</Badge>
                  <Badge
                    className={
                      invite.status === "revoked"
                        ? "bg-clay/40 text-cream"
                        : invite.status === "accepted"
                          ? "bg-amber text-ink"
                          : "bg-cream/10 text-cream/70"
                    }
                  >
                    {invite.status}
                  </Badge>
                  <span className="text-xs text-cream/45">
                    Sent {invite.sentCount}× · last {when(invite.lastSentAt)} via{" "}
                    {invite.lastSendChannel ?? "—"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === invite.id}
                  className="border-cream/25 bg-transparent text-cream/80 hover:bg-cream/10 hover:text-cream"
                  onClick={() =>
                    dispatch(
                      {
                        name: invite.name,
                        email: invite.email,
                        role: invite.role,
                        inviteId: invite.id,
                      },
                      invite.id,
                    )
                  }
                >
                  {busy === invite.id ? "Resending…" : "Resend"}
                </Button>
                {links[invite.id] && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber/60 bg-transparent text-amber hover:bg-amber/10"
                    onClick={() => copy(links[invite.id]!)}
                  >
                    Copy link
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === invite.id || invite.status === "revoked"}
                  className="border-clay/50 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                  onClick={async () => {
                    setBusy(invite.id);
                    try {
                      await revoke({ data: { inviteId: invite.id } });
                      toast.success("Invitation revoked.");
                      await load();
                    } catch {
                      toast.error("Couldn't revoke that invitation.");
                    }
                    setBusy(null);
                  }}
                >
                  Revoke
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

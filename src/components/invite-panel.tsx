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
    <section className="op-card mt-8 border border-[#C7D5E4] bg-white p-6 text-[#004986]">
      <p className="signage flex items-center gap-2 text-[#4C5C74]">
        <span aria-hidden className="h-3 w-[3px] bg-[#D4AF37]" />
        Invitations
      </p>
      <h2 className="mt-3 font-display text-2xl text-[#004986]">Invite staff to log in</h2>
      <p className="mt-2 max-w-2xl text-sm text-[#4C5C74]">
        Send a login invitation by email, or copy the secure link and hand it to the person
        directly. Links expire after 7 days; resending issues a fresh one and cancels the old.
      </p>

      {notice ? (
        <p className="mt-4 rounded-lg border border-[#D4AF37]/50 bg-[#FDF6E3] px-4 py-3 text-sm text-[#004986]">
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
          <label className="signage text-[#4C5C74]" htmlFor="invite-name">
            Name
          </label>
          <Input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Michael"
            className="mt-1 border-[#C7D5E4] bg-white text-[#004986]"
          />
        </div>
        <div className="min-w-[12rem] flex-[2]">
          <label className="signage text-[#4C5C74]" htmlFor="invite-email">
            Email
          </label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="michael@daysinnwildwood.com"
            className="mt-1 border-[#C7D5E4] bg-white text-[#004986]"
          />
        </div>
        <div>
          <label className="signage text-[#4C5C74]" htmlFor="invite-role">
            Access
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
            className="mt-1 block h-9 rounded-md border border-[#C7D5E4] bg-white px-2 text-sm text-[#004986]"
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
          className="bg-[#D4AF37] text-[#004986] hover:bg-[#c5a231]"
        >
          {busy === "new" ? "Sending…" : "Send invitation"}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#4C5C74]">
        <span>Quick fill:</span>
        {SUGGESTED.map((person) => (
          <button
            key={person}
            type="button"
            className="rounded-md border border-[#C7D5E4] px-2 py-1 text-[#004986] hover:bg-[#EEF3F9]"
            onClick={() => setName(person)}
          >
            {person}
          </button>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-[#C7D5E4]">
        {invites.length === 0 && (
          <li className="py-4 text-sm text-[#4C5C74]">No invitations yet.</li>
        )}
        {invites.map((invite) => (
          <li key={invite.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm">
                  {invite.name} <span className="text-[#4C5C74]">· {invite.email}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#E4ECF5] text-[#004986]">{ROLE_LABEL[invite.role]}</Badge>
                  <Badge
                    className={
                      invite.status === "revoked"
                        ? "bg-[#B91C1C] text-white"
                        : invite.status === "accepted"
                          ? "bg-[#D4AF37] text-[#004986]"
                          : "bg-[#E4ECF5] text-[#4C5C74]"
                    }
                  >
                    {invite.status}
                  </Badge>
                  <span className="text-xs text-[#4C5C74]">
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
                  className="border-[#C7D5E4] bg-white text-[#004986] hover:bg-[#EEF3F9]"
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
                    className="border-[#D4AF37] bg-white text-[#8a6d10] hover:bg-[#FDF6E3]"
                    onClick={() => copy(links[invite.id]!)}
                  >
                    Copy link
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === invite.id || invite.status === "revoked"}
                  className="border-[#E3B7B7] bg-white text-[#B91C1C] hover:bg-[#FDECEC]"
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

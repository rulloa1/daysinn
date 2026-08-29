import { useServerFn } from "@tanstack/react-start";
import { KeyRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listStaffPinStatus, setStaffPin } from "@/lib/housekeeping.functions";

type PinRow = {
  id: string;
  name: string;
  department: string;
  active: boolean;
  hasPin: boolean;
  /** How many other accounts hold these same four digits. */
  sharedWith: number;
};

const DEPARTMENT_LABEL: Record<string, string> = {
  housekeeping: "Housekeeping",
  front_desk: "Front desk",
  management: "Management",
  maintenance: "Maintenance",
};

/**
 * Manager-only. Sets and clears the 4-digit PIN housekeepers sign on with.
 * The PIN is never read back — the list only reports whether one is set.
 */
export function StaffPinPanel() {
  const fetchStatus = useServerFn(listStaffPinStatus);
  const savePin = useServerFn(setStaffPin);

  const [rows, setRows] = useState<PinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const sharedCount = rows.filter((r) => r.hasPin && r.sharedWith > 0).length;

  const load = useCallback(async () => {
    try {
      setRows(await fetchStatus({ data: undefined }));
    } catch {
      toast.error("Couldn't load the roster.");
    }
    setLoading(false);
  }, [fetchStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(member: PinRow) {
    setBusy(member.id);
    try {
      const result = await savePin({ data: { memberId: member.id, pin: draft } });
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(`PIN set for ${member.name}.`);
        setEditing(null);
        setDraft("");
        await load();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save that PIN.");
    }
    setBusy(null);
  }

  async function clear(member: PinRow) {
    if (
      !window.confirm(
        `Clear ${member.name}'s PIN? They will sign on with their name alone until a new one is set.`,
      )
    )
      return;
    setBusy(member.id);
    try {
      const result = await savePin({ data: { memberId: member.id, pin: "" } });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success(`PIN cleared for ${member.name}.`);
        await load();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't clear that PIN.");
    }
    setBusy(null);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7EDF5] text-[#004986]">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Staff sign-on PINs</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Housekeeping signs on with a name tap and four digits. Set the PIN with the person in
            front of you, let them choose the digits, and do not write it down anywhere. Anyone
            without a PIN can sign on with their name alone, and anyone sharing a PIN with a
            colleague can sign on as them — which is what makes the per-person room timings on
            Reports mean anything.
          </p>
        </div>
      </div>

      {sharedCount > 0 ? (
        <p className="mt-4 rounded-lg border border-[#E4BFBB] bg-[#FBEAE9] px-4 py-3 text-xs leading-relaxed text-[#B91C1C]">
          <strong>{sharedCount} accounts are signing on with a PIN somebody else also has.</strong>{" "}
          Until each person has their own four digits, the room timings on Reports record a name
          rather than a person.
        </p>
      ) : null}

      {loading ? (
        <p className="mt-5 text-xs text-slate-400">Loading roster…</p>
      ) : rows.length === 0 ? (
        <p className="mt-5 text-xs text-slate-400">Nobody is on the roster yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {rows.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{member.name}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {DEPARTMENT_LABEL[member.department] ?? member.department}
                  {member.active ? "" : " · inactive"}
                </span>
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${
                  !member.hasPin
                    ? "bg-[#FBF0E2] text-[#B45309]"
                    : member.sharedWith > 0
                      ? "bg-[#FBEAE9] text-[#B91C1C]"
                      : "bg-[#E7F4EE] text-[#0F7B4F]"
                }`}
                title={
                  member.sharedWith > 0
                    ? `${member.name} signs on with the same four digits as ${member.sharedWith} other account(s).`
                    : undefined
                }
              >
                {!member.hasPin
                  ? "Name only"
                  : member.sharedWith > 0
                    ? `Shared with ${member.sharedWith}`
                    : "PIN set"}
              </span>

              {editing === member.id ? (
                <span className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={draft}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4 digits"
                    aria-label={`New PIN for ${member.name}`}
                    onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-8 w-24 rounded-lg text-center font-mono text-sm tracking-[0.3em]"
                  />
                  <Button
                    size="sm"
                    disabled={draft.length !== 4 || busy === member.id}
                    onClick={() => save(member)}
                    className="h-8 rounded-lg bg-[#004986] text-xs font-bold text-white"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(null);
                      setDraft("");
                    }}
                    className="h-8 rounded-lg text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </Button>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={busy === member.id}
                    onClick={() => {
                      setEditing(member.id);
                      setDraft("");
                    }}
                    className="h-8 rounded-lg border border-slate-300 bg-white text-xs font-bold text-[#004986] hover:bg-slate-50"
                  >
                    {member.hasPin ? "Reset PIN" : "Set PIN"}
                  </Button>
                  {member.hasPin ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === member.id}
                      onClick={() => clear(member)}
                      className="h-8 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Clear
                    </Button>
                  ) : null}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

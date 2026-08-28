import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLockup } from "@/components/brand-lockup";
import { verifyStaffPin } from "@/lib/housekeeping.functions";
import type { StaffIdentity } from "@/lib/ops";

/**
 * Shift sign-in. The property account is already authenticated at this point;
 * this picks which housekeeper the room changes get logged to.
 */
export function HousekeeperLogin({
  members,
  onSelect,
  onAdd,
}: {
  members: { id: string; name: string }[];
  onSelect: (next: StaffIdentity) => void;
  onAdd: (name: string) => Promise<unknown>;
}) {
  const verify = useServerFn(verifyStaffPin);
  const [memberId, setMemberId] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function signIn() {
    if (!memberId) return;
    setBusy(true);
    const res = await verify({ data: { memberId, pin } });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.reason === "bad_pin" ? "That PIN doesn't match." : "Housekeeper not found.");
      return;
    }
    onSelect({ id: res.id, name: res.name });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-10 text-cream">
      <div className="w-full max-w-sm">
        <BrandLockup tone="cream" />
        <p className="signage mt-6 flex items-center gap-2 text-cream/60">
          <span aria-hidden className="h-3 w-[3px] bg-amber" />
          Housekeeping
        </p>
        <h1 className="mt-3 text-4xl">Who's cleaning?</h1>
        <p className="mt-2 text-sm text-cream/60">
          Pick your name so every room you turn is logged to you.
        </p>

        <label className="signage mt-8 block text-cream/50" htmlFor="hk-name">
          Housekeeper
        </label>
        <select
          id="hk-name"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="mt-2 h-12 w-full border border-cream/25 bg-cream/[0.04] px-3 text-base text-cream"
        >
          <option value="">Select your name</option>
          {members.map((m) => (
            <option key={m.id} value={m.id} className="text-ink">
              {m.name}
            </option>
          ))}
        </select>

        <label className="signage mt-5 block text-cream/50" htmlFor="hk-pin">
          PIN (if you have one)
        </label>
        <Input
          id="hk-pin"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="mt-2 h-12 border-cream/20 bg-cream/[0.04] text-base text-cream placeholder:text-cream/35"
        />

        <Button
          onClick={signIn}
          disabled={!memberId || busy}
          className="mt-6 h-12 w-full bg-amber text-base text-ink hover:bg-amber/90"
        >
          {busy ? "Checking…" : "Start shift"}
        </Button>

        {adding ? (
          <div className="mt-6 flex gap-2">
            <Input
              autoFocus
              value={newName}
              placeholder="Your name"
              onChange={(e) => setNewName(e.target.value)}
              className="h-11 border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
            />
            <Button
              className="h-11 bg-cream/10 text-cream hover:bg-cream/20"
              onClick={async () => {
                await onAdd(newName);
                setNewName("");
                setAdding(false);
              }}
            >
              Add
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="signage mt-6 text-cream/50 transition-colors duration-200 hover:text-amber"
          >
            + Add me to the roster
          </button>
        )}

        <Link
          to="/staff"
          className="signage mt-8 inline-block text-cream/45 transition-colors duration-200 hover:text-amber"
        >
          ← Staff portal
        </Link>
      </div>
    </div>
  );
}

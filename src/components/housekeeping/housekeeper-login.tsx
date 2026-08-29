import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, Delete, Sparkles } from "lucide-react";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import { verifyStaffPin } from "@/lib/housekeeping.functions";
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
  const verify = useServerFn(verifyStaffPin);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  // Auto-submit on 4 digits
  useEffect(() => {
    if (pin.length === 4 && selectedMember && !busy) {
      void handleSubmitPin();
    }
  }, [pin, selectedMember]);

  async function handleSubmitPin() {
    if (!selectedMember) return;
    setBusy(true);
    try {
      const res = await verify({ data: { memberId: selectedMember.id, pin } });
      if (!res.ok) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
        toast.error(
          res.reason === "bad_pin" ? "Incorrect PIN. Try again." : "Staff member not found.",
        );
        return;
      }
      toast.success(`Welcome, ${res.name}`);
      onSelect({ id: res.id, name: res.name });
    } catch (error) {
      // The PIN check requires a housekeeping, front-desk or manager role on the
      // signed-in account; a brand-new account has none until a manager grants it.
      const forbidden = error instanceof Error && /forbidden|authentication/i.test(error.message);
      toast.error(
        forbidden
          ? "This device is signed in to an account without housekeeping access. Ask a manager to grant it."
          : "Couldn't verify PIN. Please try again.",
      );
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  function handleDigit(d: string) {
    if (pin.length < 4 && !busy) {
      setPin((prev) => prev + d);
    }
  }

  function handleBackspace() {
    if (!busy) {
      setPin((prev) => prev.slice(0, -1));
    }
  }

  function handleClear() {
    if (!busy) {
      setPin("");
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

  // If a member is selected, show the 4-digit PIN Keypad
  if (selectedMember) {
    const initials = selectedMember.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#00243F] px-4 py-8 text-white">
        <div className="flex w-full max-w-xs flex-col items-center">
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setSelectedMember(null);
              setPin("");
            }}
            className="flex items-center gap-1.5 self-start text-xs font-semibold text-white/70 hover:text-white mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Not you?
          </button>

          {/* Avatar and name */}
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#D4AF37] font-serif text-xl font-bold text-[#004986] shadow-lg">
            {initials}
          </div>

          <h1 className="mt-3 font-serif text-2xl font-bold text-center">{selectedMember.name}</h1>
          <p className="mt-1 text-xs text-white/70">
            {busy ? "Signing you in…" : "Enter your 4-digit PIN"}
          </p>

          {/* 4 PIN Dots */}
          <div
            className={`mt-6 flex items-center justify-center gap-4 ${
              shake ? "animate-shake" : ""
            }`}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`h-4 w-4 rounded-full transition-all ${
                    isFilled
                      ? "bg-[#D4AF37] ring-2 ring-[#D4AF37] scale-110"
                      : "border-2 border-white/35 bg-transparent"
                  }`}
                />
              );
            })}
          </div>

          {/* Numeric Keypad (3x4) */}
          <div className="mt-8 grid w-full grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit.toString())}
                disabled={busy}
                className="flex h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 font-mono text-2xl font-semibold text-white transition active:bg-white/25 active:scale-95 disabled:opacity-50"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              disabled={busy || pin.length === 0}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-transparent text-xs font-semibold uppercase tracking-wider text-white/60 transition active:bg-white/10 disabled:opacity-30"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigit("0")}
              disabled={busy}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 font-mono text-2xl font-semibold text-white transition active:bg-white/25 active:scale-95 disabled:opacity-50"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              disabled={busy || pin.length === 0}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-transparent text-white/70 transition active:bg-white/10 disabled:opacity-30"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          {/* Reset PIN note */}
          <button
            type="button"
            onClick={() => toast.info("Contact front desk to reset your PIN.")}
            className="mt-8 text-xs text-white/50 hover:text-white/80"
          >
            Forgot PIN? Ask the front desk
          </button>
        </div>
      </div>
    );
  }

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
                onClick={() => setSelectedMember(member)}
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

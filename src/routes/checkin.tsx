import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BrandLockup } from "@/components/brand-lockup";
import { QrCode } from "@/components/qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guestSignIn } from "@/lib/guest.functions";
import { writeGuestSession } from "@/lib/guest-session";
import { KeyRound, QrCode as QrIcon, Sparkles, Phone, ShieldCheck, ArrowLeft } from "lucide-react";

import { FranchiseLegal } from "@/components/franchise-footer";

export const Route = createFileRoute("/checkin")({
  validateSearch: (search: Record<string, unknown>): { room?: string; t?: string } => ({
    ...(typeof search['room'] === "string" ? { room: search['room'] } : {}),
    ...(typeof search['t'] === "string" ? { t: search['t'] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Digital Room Sign-In — Days Inn® by Wyndham Wildwood I-75" },
      {
        name: "description",
        content:
          "Sign in with your room number and last name or scan your mobile QR key to access in-room requests directly on your smartphone.",
      },
      { property: "og:title", content: "Digital Room Sign-In — Days Inn® by Wyndham Wildwood I-75" },
      {
        property: "og:description",
        content:
          "Sign in with your room number and last name or scan your mobile QR key to access in-room requests directly on your smartphone.",
      },
    ],
  }),
  component: CheckInPage,
});

function CheckInPage() {
  const { room: roomParam, t: tokenParam } = Route.useSearch();
  const navigate = useNavigate();
  const signIn = useServerFn(guestSignIn);
  const [room, setRoom] = useState(roomParam ?? "");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const base = `${window.location.origin}/checkin`;
    setUrl(roomParam ? `${base}?room=${encodeURIComponent(roomParam)}` : base);
  }, [roomParam]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!room.trim() || !lastName.trim()) {
      toast.error("Enter your room number and last name.");
      return;
    }
    setBusy(true);
    try {
      const result = await signIn({
        data: {
          room: room.trim(),
          lastName: lastName.trim(),
          ...(tokenParam ? { token: tokenParam } : {}),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      writeGuestSession({
        room: result.guest.room,
        lastName: lastName.trim(),
        guestName: result.guest.guestName,
        checkOut: result.guest.checkOut,
        expiresAt: result.expiresAt,
      });
      toast.success(`Welcome to Room ${result.guest.room}!`, {
        description: "Your digital guest session is active.",
      });
      navigate({ to: "/room" });
    } catch {
      toast.error("We couldn't sign you in. Please verify with the front desk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-amber/30 selection:text-ink">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 px-6 py-4 backdrop-blur-xl md:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <BrandLockup />
          <Link
            to="/"
            className="spring-hover inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to guest hub
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto my-auto w-full max-w-4xl px-6 py-10 md:px-8">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-stretch">
          
          {/* Keycard Form Card */}
          <section className="glass-card relative flex flex-col justify-between overflow-hidden rounded-3xl p-7 md:p-9">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent via-amber to-primary" />
            
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/20 text-accent font-bold text-xs">
                  <KeyRound className="h-4 w-4" />
                </span>
                <span className="signage text-accent font-bold">Express Digital Access</span>
              </div>

              <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Sign in to <span className="text-primary underline decoration-accent/60 underline-offset-4">your room</span>.
              </h1>
              
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Enter your room number and the registered last name from your key packet to unlock mobile concierge & instant requests.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="checkin-room" className="text-xs font-semibold text-foreground">
                    Room Number
                  </Label>
                  <Input
                    id="checkin-room"
                    value={room}
                    maxLength={10}
                    placeholder="e.g. 214"
                    onChange={(event) => setRoom(event.target.value)}
                    className="h-11 rounded-xl border-border/80 bg-background/80 text-sm focus-visible:ring-accent"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkin-name" className="text-xs font-semibold text-foreground">
                    Last Name on Reservation
                  </Label>
                  <Input
                    id="checkin-name"
                    value={lastName}
                    maxLength={80}
                    placeholder="e.g. Smith"
                    onChange={(event) => setLastName(event.target.value)}
                    className="h-11 rounded-xl border-border/80 bg-background/80 text-sm focus-visible:ring-accent"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={busy}
                  className="spring-hover mt-2 h-11 w-full rounded-xl bg-accent font-bold text-accent-foreground shadow-md hover:brightness-105"
                >
                  {busy ? "Verifying room..." : "Access Room Concierge →"}
                </Button>
              </form>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Encrypted Session
              </span>
              <a href="tel:+13527487766" className="font-semibold text-primary hover:underline">
                Call Front Desk
              </a>
            </div>
          </section>

          {/* QR Code Scanner Card */}
          <section className="glass-panel flex flex-col items-center justify-center rounded-3xl p-7 text-center md:p-9">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
              <QrIcon className="h-3.5 w-3.5" /> Mobile QR Scanner
            </span>
            
            <h2 className="mt-3 font-serif text-xl font-bold text-foreground">
              Instant Phone Sign-In
            </h2>
            
            <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
              Scan with your smartphone camera to open your in-room services directly on mobile.
            </p>

            <div className="my-6 rounded-2xl border border-border/80 bg-white p-4 shadow-inner">
              {url ? <QrCode value={url} size={180} alt="Days Inn Room Sign-In QR Code" /> : null}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {roomParam ? (
                <span>Auto-configured for <strong>Room {roomParam}</strong></span>
              ) : (
                <span>QR codes on key jackets link directly to your assigned room.</span>
              )}
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/40 py-6 px-6">
        <div className="mx-auto max-w-4xl space-y-2">
          <FranchiseLegal />
        </div>
      </footer>
    </div>
  );
}

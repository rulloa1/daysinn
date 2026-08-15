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

export const Route = createFileRoute("/checkin")({
  validateSearch: (search: Record<string, unknown>): { room?: string } =>
    typeof search['room'] === "string" ? { room: search['room'] } : {},
  head: () => ({
    meta: [
      { title: "Room Sign-In — Rodeway Hub" },
      {
        name: "description",
        content:
          "Scan the QR code and sign in with your room number and last name to send requests from your phone.",
      },
      { property: "og:title", content: "Room Sign-In — Rodeway Hub" },
      {
        property: "og:description",
        content:
          "Scan the QR code and sign in with your room number and last name to send requests from your phone.",
      },
    ],
  }),
  component: CheckInPage,
});

function CheckInPage() {
  const { room: roomParam } = Route.useSearch();
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
        data: { room: room.trim(), lastName: lastName.trim() },
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
      });
      navigate({ to: "/room" });
    } catch {
      toast.error("We couldn't sign you in. Please see the front desk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-12">
        <BrandLockup />
        <Link to="/" className="signage text-muted-foreground hover:text-ink">
          Guest hub
        </Link>
      </header>

      <main className="mx-auto grid max-w-4xl gap-10 px-6 py-10 md:grid-cols-[1fr_1fr] md:items-start md:px-12">
        <section>
          <p className="signage flex items-center gap-2 text-muted-foreground">
            <span aria-hidden className="h-3 w-[3px] bg-amber" />
            Room sign-in
          </p>
          <h1 className="mt-2 text-4xl leading-[1.05] md:text-5xl">
            Sign in to <em className="text-amber">your room.</em>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the room number on your key card and the last name on the
            reservation.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checkin-room">Room number</Label>
              <Input
                id="checkin-room"
                value={room}
                maxLength={10}
                placeholder="e.g. 214"
                onChange={(event) => setRoom(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkin-name">Last name</Label>
              <Input
                id="checkin-name"
                value={lastName}
                maxLength={80}
                placeholder="e.g. Ulloa"
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-amber text-ink hover:bg-amber/90"
            >
              {busy ? "Checking…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Trouble signing in? Call the front desk at (352) 793-5010.
          </p>
        </section>

        <section className="border border-border bg-card p-6 text-center">
          <p className="signage text-amber">Scan to sign in on your phone</p>
          <div className="mt-4 flex justify-center">
            {url ? <QrCode value={url} size={196} alt="Sign-in QR code" /> : null}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Point your camera here to open this page on your phone
            {roomParam ? ` for room ${roomParam}` : ""}.
          </p>
        </section>
      </main>
    </div>
  );
}

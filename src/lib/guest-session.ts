export type GuestSession = {
  room: string;
  lastName: string;
  guestName: string;
  checkOut: string | null;
  /** ISO timestamp; the session is ignored (and cleared) after this. */
  expiresAt: string;
};

const KEY = "rodeway.guest.session";

export function readGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<GuestSession>;
    if (
      !session.room ||
      !session.lastName ||
      !session.expiresAt ||
      Date.parse(session.expiresAt) <= Date.now()
    ) {
      clearGuestSession();
      return null;
    }
    return session as GuestSession;
  } catch {
    return null;
  }
}

export function writeGuestSession(session: GuestSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearGuestSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

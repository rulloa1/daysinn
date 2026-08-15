export type GuestSession = {
  room: string;
  lastName: string;
  guestName: string;
  checkOut: string | null;
};

const KEY = "rodeway.guest.session";

export function readGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestSession) : null;
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

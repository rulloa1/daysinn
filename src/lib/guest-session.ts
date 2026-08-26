export type GuestSession = {
  room: string;
  lastName: string;
  guestName: string;
  checkOut: string | null;
  /** ISO timestamp; the session is ignored (and cleared) after this. */
  expiresAt: string;
};

const KEY = "daysinn.guest.session";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates untrusted browser storage before it is used to scope a guest session.
 * The optional timestamp makes expiration behavior deterministic in tests.
 */
export function isValidGuestSession(value: unknown, now = Date.now()): value is GuestSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<GuestSession>;
  if (
    !isNonEmptyString(session.room) ||
    !isNonEmptyString(session.lastName) ||
    !isNonEmptyString(session.guestName) ||
    !isNonEmptyString(session.expiresAt) ||
    (session.checkOut !== null && typeof session.checkOut !== "string")
  ) {
    return false;
  }

  const expiresAt = Date.parse(session.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function readGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;

    const session: unknown = JSON.parse(raw);
    if (!isValidGuestSession(session)) {
      clearGuestSession();
      return null;
    }

    return session;
  } catch {
    clearGuestSession();
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

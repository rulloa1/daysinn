/**
 * The property's canonical public origin.
 *
 * Guest-facing links are built from this rather than from
 * `window.location.origin`, because printed collateral outlives the
 * deployment that generated it: a QR card built from the current origin
 * keeps pointing at a preview or branch host long after that host is gone,
 * and the cards are sitting in guest rooms by then.
 *
 * Server code reads `PUBLIC_SITE_URL` first and falls back to this value.
 * Change both together when the property moves to a new domain.
 */
export const SITE_URL = "https://daysinn.lovable.app";

/**
 * Absolute guest check-in link for a room. Pass `token` for the rotating
 * front-desk code; omit it for the static card printed for the room.
 */
export function guestCheckinUrl(room: string, token?: string): string {
  const base = `${SITE_URL}/checkin?room=${encodeURIComponent(room)}`;
  return token ? `${base}&t=${encodeURIComponent(token)}` : base;
}

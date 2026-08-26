/**
 * A stay remains active through the end of its checkout date in UTC.
 * Invalid values fail closed so malformed checkout data never extends guest access.
 */
export function isPastCheckout(checkOut: string | null, now = Date.now()): boolean {
  if (!checkOut) return false;

  const date = checkOut.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return true;

  const expiresAt = Date.parse(`${date}T23:59:59.999Z`);
  return !Number.isFinite(expiresAt) || expiresAt < now;
}

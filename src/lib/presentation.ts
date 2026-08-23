import { useEffect, useState } from "react";

/**
 * Presentation mode: unlocks the staff-side portals (staff, front desk,
 * housekeeping) so every page can be clicked through during a demo without
 * signing in at each stop. Turned on by `?present=true` or `?demo=true` on any
 * portal URL, then remembered on the device until it is turned off.
 */
const KEY = "daysinn.presentation";

export const PRESENTER_IDENTITY = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Presenter",
};

export function readPresentationMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("present") === "false" || params.get("demo") === "false") {
    window.localStorage.removeItem(KEY);
    return false;
  }
  if (params.has("present") || params.has("demo")) {
    window.localStorage.setItem(KEY, "1");
    return true;
  }
  return window.localStorage.getItem(KEY) === "1";
}

export function setPresentationMode(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(KEY, "1");
  else window.localStorage.removeItem(KEY);
}

/** Client-only read so SSR and hydration agree. */
export function usePresentationMode(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(readPresentationMode());
  }, []);
  return on;
}

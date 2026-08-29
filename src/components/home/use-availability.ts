import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { BOOKING_URL } from "@/components/franchise-footer";
import { checkAvailability, type AvailabilityRow } from "@/lib/availability.functions";

export type { AvailabilityRow };


/**
 * Date/guest selection and the indicative availability snapshot behind the
 * booking hero. The numbers here are a property-side estimate only — the real
 * rate, taxes and terms are settled in the Wyndham booking flow.
 */
export function useAvailability() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [rows, setRows] = useState<AvailabilityRow[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    setCheckIn(today.toISOString().slice(0, 10));
    setCheckOut(tomorrow.toISOString().slice(0, 10));
  }, []);

  const nights = useMemo(
    () =>
      checkIn && checkOut
        ? Math.max(
            0,
            Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000),
          )
        : 0,
    [checkIn, checkOut],
  );

  /** Hand the guest's chosen dates through to the official booking flow. */
  function bookingLink(roomType?: string) {
    const url = new URL(BOOKING_URL);
    if (checkIn) url.searchParams.set("checkInDate", checkIn);
    if (checkOut) url.searchParams.set("checkOutDate", checkOut);
    if (guests) url.searchParams.set("adults", guests);
    if (roomType) url.searchParams.set("roomType", roomType);
    return url.toString();
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!checkIn || !checkOut || nights < 1) {
      toast.error("Choose a check-out date after your check-in date.");
      return;
    }
    setSearching(true);
    const { data, error } = await supabase.rpc("check_availability", {
      _check_in: checkIn,
      _check_out: checkOut,
      _guests: Number(guests) || 1,
    });
    setSearching(false);
    if (error) {
      toast.error("We couldn't check availability. Please call the front desk.");
      return;
    }
    const result = (data ?? []) as AvailabilityRow[];
    setRows(result);
    if (!result.some((row) => row.available_count > 0)) {
      toast.info("No rooms open for those dates — try nearby dates or call us.");
    }
  }

  return {
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    setGuests,
    rows,
    searching,
    nights,
    bookingLink,
    search,
  };
}

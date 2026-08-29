import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AvailabilityRow = {
  room_type: string;
  label: string;
  beds: string;
  max_occupancy: number;
  nightly_rate: number;
  available_count: number;
};

const AvailabilityInput = z.object({
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(8),
});

/**
 * Public availability snapshot. The underlying database routine reads room and
 * booking rows, so it is no longer callable by guests or signed-in users
 * directly — it runs here, behind validated input, and only returns aggregated
 * room-type counts and rates.
 */
export const checkAvailability = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AvailabilityInput.parse(input))
  .handler(async ({ data }): Promise<AvailabilityRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("check_availability", {
      _check_in: data.check_in,
      _check_out: data.check_out,
      _guests: data.guests,
    });
    if (error) throw new Error("availability_unavailable");
    return (rows ?? []) as AvailabilityRow[];
  });

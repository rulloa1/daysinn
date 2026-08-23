import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_room_status",
  title: "Update room status",
  description:
    "Set the housekeeping status of a room (and optionally the do-not-disturb flag). Requires a staff or manager role.",
  inputSchema: {
    room_number: z.string().trim().min(1).max(10).describe("Room number, e.g. 214."),
    status: z
      .enum(["clean", "dirty", "in_progress", "inspected", "out_of_order", "occupied", "vacant"])
      .describe("New room status."),
    dnd: z.boolean().optional().describe("Set the do-not-disturb flag."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ room_number, status, dnd }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (typeof dnd === "boolean") patch['dnd'] = dnd;

    const { data, error } = await supabase
      .from("rooms")
      .update(patch)
      .eq("number", room_number)
      .select("id, number, status, dnd, floor")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: `Room ${room_number} not found, or your role does not allow updating it.` }],
        isError: true,
      };

    return {
      content: [{ type: "text", text: `Room ${room_number} set to ${status}.` }],
      structuredContent: { room: data },
    };
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";
import { ASSISTANT_ROOM_STATUSES, fromAssistantRoomStatus } from "@/lib/room-model";

export default defineTool({
  name: "update_room_status",
  title: "Update room status",
  description:
    "Set the housekeeping status of a room (and optionally the do-not-disturb flag). Requires a staff or manager role.",
  inputSchema: {
    room_number: z.string().trim().min(1).max(10).describe("Room number, e.g. 214."),
    status: z.enum(ASSISTANT_ROOM_STATUSES).describe("New room status."),
    dnd: z.boolean().optional().describe("Set the do-not-disturb flag."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ room_number, status, dnd }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    // The tool's status vocabulary is plain English for the model's benefit and
    // shares no labels with the room_status enum — map before writing.
    const next = fromAssistantRoomStatus(status);
    const patch: Record<string, unknown> = {
      hk_stage: next.hk_stage,
      updated_at: new Date().toISOString(),
    };
    if (next.status) patch["status"] = next.status;
    if (typeof next.dnd === "boolean") patch["dnd"] = next.dnd;
    if (typeof dnd === "boolean") patch["dnd"] = dnd;

    const { data, error } = await supabase
      .from("rooms")
      .update(patch)
      .eq("number", room_number)
      .select("id, number, status, hk_stage, dnd, floor")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [
          {
            type: "text",
            text: `Room ${room_number} not found, or your role does not allow updating it.`,
          },
        ],
        isError: true,
      };

    return {
      content: [{ type: "text", text: `Room ${room_number} set to ${status}.` }],
      structuredContent: { room: data },
    };
  },
});

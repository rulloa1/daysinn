import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_rooms",
  title: "List rooms",
  description:
    "List rooms on the front-desk board with housekeeping status, floor, occupancy and assignment. Guest names are masked for non-staff roles.",
  inputSchema: {
    status: z
      .string()
      .trim()
      .optional()
      .describe("Filter by room status, e.g. clean, dirty, occupied."),
    floor: z.number().int().min(1).max(20).optional().describe("Only rooms on this floor."),
    limit: z.number().int().min(1).max(200).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, floor, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("rooms_board");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = ((data ?? []) as Array<Record<string, unknown>>)
      .filter((r) => (status ? r["status"] === status : true))
      .filter((r) => (floor ? r["floor"] === floor : true))
      .slice(0, limit);

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, rooms: rows },
    };
  },
});

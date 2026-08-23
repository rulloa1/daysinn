import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_requests",
  title: "List guest requests",
  description:
    "List guest service requests (towels, housekeeping, repairs, front desk) with their current status.",
  inputSchema: {
    status: z
      .enum(["new", "in_progress", "resolved", "all"])
      .default("all")
      .describe("Filter by workflow status."),
    room: z.string().trim().optional().describe("Only requests for this room number."),
    limit: z.number().int().min(1).max(100).default(25),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, room, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("requests_board");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = ((data ?? []) as Array<Record<string, unknown>>)
      .filter((r) => (status === "all" ? true : r['status'] === status))
      .filter((r) => (room ? String(r['room']) === room : true))
      .slice(0, limit);

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, requests: rows },
    };
  },
});

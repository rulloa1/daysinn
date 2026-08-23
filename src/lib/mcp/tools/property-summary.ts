import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "property_summary",
  title: "Property summary",
  description:
    "Snapshot of the property: open vs resolved requests, room status counts, and rooms flagged do-not-disturb.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const [requests, rooms] = await Promise.all([
      supabase.rpc("requests_board"),
      supabase.rpc("rooms_board"),
    ]);
    const error = requests.error ?? rooms.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const requestRows = (requests.data ?? []) as Array<Record<string, unknown>>;
    const roomRows = (rooms.data ?? []) as Array<Record<string, unknown>>;

    const byStatus = (rows: Array<Record<string, unknown>>) =>
      rows.reduce<Record<string, number>>((acc, r) => {
        const key = String(r.status ?? "unknown");
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

    const summary = {
      requests: { total: requestRows.length, by_status: byStatus(requestRows) },
      rooms: {
        total: roomRows.length,
        by_status: byStatus(roomRows),
        do_not_disturb: roomRows.filter((r) => r.dnd === true).length,
      },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});

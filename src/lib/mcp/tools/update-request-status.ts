import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_request_status",
  title: "Update request status",
  description:
    "Move a guest request through the workflow (new, in_progress, resolved). Requires a staff or manager role.",
  inputSchema: {
    request_id: z.string().uuid().describe("Request id from list_requests."),
    status: z.enum(["new", "in_progress", "resolved"]),
    note: z.string().trim().max(500).optional().describe("Optional note recorded with the change."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ request_id, status, note }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: now };
    if (status === "in_progress") patch.started_at = now;
    if (status === "resolved") patch.resolved_at = now;

    const { data, error } = await supabase
      .from("requests")
      .update(patch)
      .eq("id", request_id)
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: "Request not found, or your role does not allow updating it." }],
        isError: true,
      };

    if (note) {
      await supabase.from("request_events").insert({
        request_id,
        status_to: status,
        body: note,
        author_name: ctx.getUserEmail() ?? "MCP client",
      });
    }

    return {
      content: [{ type: "text", text: `Request ${request_id} set to ${status}.` }],
      structuredContent: { request: data },
    };
  },
});

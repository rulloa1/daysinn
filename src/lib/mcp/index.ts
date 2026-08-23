import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRequestsTool from "./tools/list-requests";
import listRoomsTool from "./tools/list-rooms";
import updateRequestStatusTool from "./tools/update-request-status";
import updateRoomStatusTool from "./tools/update-room-status";
import propertySummaryTool from "./tools/property-summary";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "daysinn",
  title: "daysInn",
  version: "0.1.0",
  instructions:
    "Hotel operations tools for the Days Inn Wildwood hub. Use `property_summary` for a snapshot, `list_requests` and `list_rooms` to read the boards, and `update_request_status` / `update_room_status` to move work forward. All tools act as the signed-in staff member and respect their role.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    propertySummaryTool,
    listRequestsTool,
    listRoomsTool,
    updateRequestStatusTool,
    updateRoomStatusTool,
  ] as Parameters<typeof defineMcp>[0]["tools"],
});

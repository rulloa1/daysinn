import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LOVABLE_AI_URL = "https://api.lovable.ai/v1/chat/completions";
const AI_REQUEST_TIMEOUT_MS = 12_000;

export type AssistantMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ToolParamValue = string | number | boolean | null;

export type ToolCall = {
  tool: "list_rooms" | "list_requests" | "update_room_status" | "update_request_status";
  parameters: Record<string, ToolParamValue>;
};

export type AssistantResponse = {
  reply: string;
  tool_calls: ToolCall[] | undefined;
};

const UNAVAILABLE_RESPONSE: AssistantResponse = {
  reply:
    "Ops Assistant is temporarily unavailable. You can continue using the live room and request boards directly.",
  tool_calls: undefined,
};

const SYSTEM_PROMPT = `You are Ops Assistant, an AI helper inside the Days Inn Hub staff portal.
You help front-desk and housekeeping staff with quick property operations.

You have access to these tools:
- list_rooms({ status?, floor?, limit? }): List rooms on the front-desk board.
- list_requests({ status?: "new" | "in_progress" | "resolved" | "all", room?, limit? }): List guest service requests.
- update_room_status({ room_number, status: "clean" | "dirty" | "in_progress" | "inspected" | "out_of_order" | "occupied" | "vacant", dnd? }): Update a room's housekeeping status.
- update_request_status({ request_id, status: "new" | "in_progress" | "resolved", note? }): Move a guest request through its workflow.

When a staff member asks something that matches a tool, respond conversationally and include a tool_calls array. Example:
{"reply": "I'll mark room 214 as clean for you.", "tool_calls": [{"tool": "update_room_status", "parameters": {"room_number": "214", "status": "clean"}}]}

If no tool is needed, reply naturally and omit tool_calls. Keep replies short and helpful. Never ask the user to provide a request ID; if they mention a room number, you can list requests for that room first to find the right ID, or ask them to confirm.`;

function logAssistantFailure(reason: string, error?: unknown) {
  console.error("[Ops Assistant] Request unavailable", {
    reason,
    message: error instanceof Error ? error.message : undefined,
  });
}

export const askOpsAssistant = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        messages: z
          .array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string().trim().min(1).max(4_000),
            }),
          )
          .max(20),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<AssistantResponse> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      logAssistantFailure("LOVABLE_API_KEY is not configured");
      return UNAVAILABLE_RESPONSE;
    }

    const messages: AssistantMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...data.messages.filter((message) => message.role !== "system"),
    ];

    try {
      const res = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "X-User-Id": context.userId ?? "anonymous",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        logAssistantFailure(`AI gateway responded with HTTP ${res.status}`);
        return UNAVAILABLE_RESPONSE;
      }

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) {
        logAssistantFailure("AI gateway response did not include message content");
        return UNAVAILABLE_RESPONSE;
      }

      try {
        const parsed = JSON.parse(content) as Partial<AssistantResponse>;
        if (typeof parsed.reply !== "string" || !parsed.reply.trim()) {
          logAssistantFailure("AI gateway response did not include a valid reply");
          return UNAVAILABLE_RESPONSE;
        }
        return {
          reply: parsed.reply.trim(),
          tool_calls: Array.isArray(parsed.tool_calls)
            ? (parsed.tool_calls as ToolCall[])
            : undefined,
        };
      } catch {
        return { reply: content, tool_calls: undefined };
      }
    } catch (error) {
      logAssistantFailure("AI gateway fetch failed or timed out", error);
      return UNAVAILABLE_RESPONSE;
    }
  });

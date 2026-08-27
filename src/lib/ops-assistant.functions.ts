import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";


const LOVABLE_AI_URL = "https://api.lovable.ai/v1/chat/completions";

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

export const askOpsAssistant = createServerFn({ method: "POST" })
  
  .inputValidator((input) =>
    z
      .object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("LOVABLE_API_KEY is not configured.");

    const messages: AssistantMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...data.messages,
    ];

    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-User-Id": context.userId,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI gateway error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content =
      json.choices?.[0]?.message?.content?.trim() ??
      '{"reply": "I\'m not sure how to help with that."}';

    let parsed: AssistantResponse;
    try {
      parsed = JSON.parse(content) as AssistantResponse;
    } catch {
      parsed = { reply: content, tool_calls: undefined };
    }

    return parsed;
  });

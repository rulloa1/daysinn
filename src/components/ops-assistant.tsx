import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  askOpsAssistant,
  type AssistantMessage,
  type ToolCall,
} from "@/lib/ops-assistant.functions";
import {
  listRooms,
  listRequests,
  listAssignments,
  listSchedules,
  updateRoomStatus,
  updateRequestStatus,
  getPropertySummary,
} from "@/lib/assistant-tools.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";
import { toast } from "sonner";

type ChatMessage = AssistantMessage & { id: string; toolResult?: string };

const SUGGESTIONS = [
  "How many requests are open right now?",
  "Who is cleaning which rooms today?",
  "Show this week's housekeeping schedule",
  "Give me the property summary",
];

export function OpsAssistant({ canAct = false }: { canAct?: boolean }) {
  const ask = useServerFn(askOpsAssistant);
  const fetchRooms = useServerFn(listRooms);
  const fetchRequests = useServerFn(listRequests);
  const fetchAssignments = useServerFn(listAssignments);
  const fetchSchedules = useServerFn(listSchedules);
  const setRoomStatus = useServerFn(updateRoomStatus);
  const setRequestStatus = useServerFn(updateRequestStatus);
  const fetchSummary = useServerFn(getPropertySummary);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I'm Ops Assistant. Ask me about the request queue, room assignments, or shift schedules.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function executeTool(call: ToolCall): Promise<string> {
    try {
      switch (call.tool) {
        case "list_rooms": {
          const { count, rooms } = await fetchRooms({
            data: call.parameters as { status?: string; floor?: number; limit?: number },
          });
          return `${count} rooms\n${JSON.stringify(rooms.slice(0, 8), null, 2)}`;
        }
        case "list_requests": {
          const { count, requests } = await fetchRequests({
            data: call.parameters as {
              status?: "new" | "in_progress" | "done" | "all";
              room?: string;
              limit?: number;
            },
          });
          return `${count} requests\n${JSON.stringify(requests.slice(0, 8), null, 2)}`;
        }
        case "list_assignments": {
          const { count, assignments } = await fetchAssignments({
            data: call.parameters as { work_date?: string; staff_name?: string; limit?: number },
          });
          return `${count} assignments\n${JSON.stringify(assignments.slice(0, 12), null, 2)}`;
        }
        case "list_schedules": {
          const { count, schedules } = await fetchSchedules({
            data: call.parameters as {
              work_date?: string;
              staff_name?: string;
              department?: string;
              limit?: number;
            },
          });
          return `${count} scheduled shifts\n${JSON.stringify(schedules.slice(0, 12), null, 2)}`;
        }
        case "property_summary": {
          const summary = await fetchSummary({ data: {} });
          return JSON.stringify(summary, null, 2);
        }
        case "update_room_status": {
          if (!canAct) return "You don't have permission to change room status.";
          const result = await setRoomStatus({
            data: call.parameters as { room_number: string; status: string; dnd?: boolean },
          });
          const room = result?.room;
          if (!room) return "Room update returned no data.";
          return `Updated room ${room["number"]} to ${room["status"]}.`;
        }
        case "update_request_status": {
          if (!canAct) return "You don't have permission to update requests.";
          const result = await setRequestStatus({
            data: call.parameters as {
              request_id: string;
              status: "new" | "in_progress" | "done";
              note?: string;
            },
          });
          const request = result?.request;
          if (!request) return "Request update returned no data.";
          return `Updated request ${request["id"]} to ${request["status"]}.`;
        }
        default:
          return "Unknown tool.";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Tool failed: ${msg}`;
    }
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const history: AssistantMessage[] = messages
        .filter((m) => m.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));
      history.push({ role: "user", content: text });

      const response = await ask({ data: { messages: history } });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
      };

      if (response.tool_calls && response.tool_calls.length > 0) {
        const results: string[] = [];
        for (const call of response.tool_calls) {
          const result = await executeTool(call);
          results.push(`${call.tool}: ${result}`);
        }
        assistantMsg.toolResult = results.join("\n\n");
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Assistant error: ${msg}`);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't reach the assistant service. Try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="h-[26rem] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" ? (
              <Bot className="mt-1 h-4 w-4 shrink-0 text-[#004986]" />
            ) : null}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-[#004986] text-white"
                  : "border border-slate-200 bg-white text-slate-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.toolResult ? (
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 p-2 text-xs text-slate-100">
                  {msg.toolResult}
                </pre>
              ) : null}
            </div>
            {msg.role === "user" ? (
              <User className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
            ) : null}
          </div>
        ))}
        {busy ? (
          <div className="flex gap-2">
            <Bot className="mt-1 h-4 w-4 shrink-0 text-[#004986]" />
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
              Thinking…
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the queue, assignments, or schedules…"
          className="min-h-11 flex-1 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
          disabled={busy}
        />
        <Button
          type="submit"
          disabled={busy || !input.trim()}
          className="min-h-11 bg-[#004986] text-white hover:bg-[#004986]/90"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void send(s)}
            disabled={busy}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-[#004986] hover:text-[#004986]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askOpsAssistant, type AssistantMessage, type ToolCall } from "@/lib/ops-assistant.functions";
import { listRooms, listRequests, updateRoomStatus, updateRequestStatus, getPropertySummary } from "@/lib/assistant-tools.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

type ChatMessage = AssistantMessage & { id: string; toolResult?: string };

const SUGGESTIONS = [
  "What's the property summary?",
  "List dirty rooms on floor 2",
  "Mark room 214 as clean",
  "Show open requests for room 118",
];

export function OpsAssistant() {
  const ask = useServerFn(askOpsAssistant);
  const fetchRooms = useServerFn(listRooms);
  const fetchRequests = useServerFn(listRequests);
  const setRoomStatus = useServerFn(updateRoomStatus);
  const setRequestStatus = useServerFn(updateRequestStatus);
  const fetchSummary = useServerFn(getPropertySummary);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: "Hi — I'm Ops Assistant. Ask me about rooms, requests, or tell me to update a status." },
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
          const { count, rooms } = await fetchRooms({ data: call.parameters as { status?: string; floor?: number; limit?: number } });
          return `Found ${count} rooms:\n${JSON.stringify(rooms.slice(0, 5), null, 2)}${count > 5 ? "\n..." : ""}`;
        }
        case "list_requests": {
          const { count, requests } = await fetchRequests({ data: call.parameters as { status?: "new" | "in_progress" | "done" | "all"; room?: string; limit?: number } });
          return `Found ${count} requests:\n${JSON.stringify(requests.slice(0, 5), null, 2)}${count > 5 ? "\n..." : ""}`;
        }
        case "update_room_status": {
          const result = await setRoomStatus({ data: call.parameters as { room_number: string; status: string; dnd?: boolean } });
          const room = result?.room;
          if (!room) return "Room update returned no data.";
          return `Updated room ${room["number"]} to ${room["status"]}.`;
        }
        case "update_request_status": {
          const result = await setRequestStatus({ data: call.parameters as { request_id: string; status: "new" | "in_progress" | "done"; note?: string } });
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
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I couldn't reach the assistant service. Try again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-cream/10 bg-cream/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-cream/80">
          <Sparkles className="h-4 w-4 text-amber" />
          Ops Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 space-y-3 overflow-y-auto rounded border border-cream/10 bg-ink/50 p-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" ? <Bot className="mt-0.5 h-4 w-4 shrink-0 text-amber" /> : null}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user" ? "bg-amber text-ink" : "bg-cream/10 text-cream"
                }`}
              >
                <p>{msg.content}</p>
                {msg.toolResult ? (
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-ink p-2 text-xs text-cream/70">
                    {msg.toolResult}
                  </pre>
                ) : null}
              </div>
              {msg.role === "user" ? <User className="mt-0.5 h-4 w-4 shrink-0 text-cream/60" /> : null}
            </div>
          ))}
          {busy ? (
            <div className="flex gap-2">
              <Bot className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <div className="rounded-lg bg-cream/10 px-3 py-2 text-sm text-cream/70">Thinking…</div>
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
            placeholder="Ask about rooms or requests…"
            className="flex-1 border-cream/20 bg-ink text-cream placeholder:text-cream/40"
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !input.trim()} className="bg-amber text-ink hover:bg-amber/90">
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
              className="rounded-full border border-cream/15 px-2.5 py-1 text-xs text-cream/70 transition-colors duration-200 hover:border-amber/50 hover:text-amber"
            >
              {s}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

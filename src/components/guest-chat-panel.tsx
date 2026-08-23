import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  body: string;
  sender: string;
  author_name: string | null;
  created_at: string;
};

function time(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Front-desk side of the guest chat thread for a single room. */
export function GuestChatPanel({
  room,
  canEdit,
  staffName,
}: {
  room: string;
  canEdit: boolean;
  staffName: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("guest_messages")
        .select("id, body, sender, author_name, created_at")
        .eq("room", room)
        .order("created_at", { ascending: true })
        .limit(100);
      if (active) setMessages((data as Message[]) ?? []);
    }

    void load();

    const channel = supabase
      .channel(`guest-messages-${room}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guest_messages", filter: `room=eq.${room}` },
        () => void load(),
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [room]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.from("guest_messages").insert({
      room,
      body,
      sender: "staff",
      author_name: staffName,
      read_by_staff: true,
    });
    setSending(false);
    if (error) {
      toast.error("Message didn't send.");
      return;
    }
    setDraft("");
  }

  return (
    <div>
      <p className="signage text-amber">Guest chat</p>
      <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-xs text-cream/45">No messages with this room yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`border px-3 py-2 text-xs ${
                message.sender === "staff"
                  ? "ml-6 border-amber/40 bg-amber/10 text-cream"
                  : "mr-6 border-cream/15 bg-cream/[0.03] text-cream/85"
              }`}
            >
              <p>{message.body}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-cream/45">
                {message.sender === "staff"
                  ? (message.author_name ?? "Front desk")
                  : (message.author_name ?? "Guest")}{" "}
                · {time(message.created_at)}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-2 flex gap-2">
        <Input
          value={draft}
          disabled={!canEdit}
          maxLength={1000}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={canEdit ? "Reply to the guest…" : "Read only"}
          className="border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
        />
        <Button
          type="submit"
          disabled={!canEdit || sending || !draft.trim()}
          className="bg-amber text-ink hover:bg-amber/90"
        >
          Send
        </Button>
      </form>
    </div>
  );
}

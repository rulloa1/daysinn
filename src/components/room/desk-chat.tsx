import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clockTime, type GuestMessage } from "./content";

/** Two-way message thread between the guest and the front desk. */
export function DeskChat({
  messages,
  draft,
  onDraftChange,
  sending,
  onSend,
}: {
  messages: GuestMessage[];
  draft: string;
  onDraftChange: (next: string) => void;
  sending: boolean;
  onSend: (event: React.FormEvent) => void;
}) {
  return (
    <section className="glass-card mt-10 rounded-3xl p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">Direct Desk Messaging</h2>
            <p className="text-xs text-muted-foreground">
              Front desk staff monitors this channel live.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Desk Online
        </span>
      </div>

      <div className="flex h-72 flex-col justify-between rounded-2xl border border-border/80 bg-background/50 p-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="font-semibold text-foreground">Start a conversation</p>
              <p>Send a message to the desk for wake-up calls, questions, or directions.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex max-w-[80%] flex-col rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  message.sender === "staff"
                    ? "mr-auto border border-border/90 bg-card text-foreground"
                    : "ml-auto border border-accent/40 bg-accent/15 text-foreground"
                }`}
              >
                <p>{message.body}</p>
                <span className="mt-1 self-end text-[10px] font-medium text-muted-foreground">
                  {message.sender === "staff" ? (message.author_name ?? "Front Desk Staff") : "You"}{" "}
                  · {clockTime(message.created_at)}
                </span>
              </div>
            ))
          )}
        </div>

        <form onSubmit={onSend} className="mt-3 flex gap-2 border-t border-border/70 pt-2">
          <Input
            value={draft}
            maxLength={1000}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Type your message to the desk…"
            className="rounded-xl border-border bg-card text-xs focus-visible:ring-accent"
            aria-label="Message the front desk"
          />
          <Button
            type="submit"
            disabled={sending || !draft.trim()}
            className="spring-hover rounded-xl bg-accent font-bold text-accent-foreground shadow-sm hover:brightness-105"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}

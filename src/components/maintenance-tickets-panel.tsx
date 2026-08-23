import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  TICKET_URGENCIES,
  type MaintenanceTicket,
  type TicketStatus,
  type TicketUrgency,
} from "@/types/operations";

type Row = {
  id: string;
  room: string;
  category: string;
  description: string;
  urgency: string;
  reporter: string | null;
  status: string;
  created_at: string;
};

const URGENCY_BADGE: Record<TicketUrgency, string> = {
  Low: "bg-transparent text-cream/50",
  Normal: "bg-cream/12 text-cream/80",
  High: "bg-amber/20 text-amber",
  Urgent: "bg-amber text-ink",
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  Open: "bg-status-dirty/20 text-status-dirty",
  "In Progress": "bg-amber/20 text-amber",
  Resolved: "bg-status-clean/20 text-status-clean",
};

function toTicket(row: Row): MaintenanceTicket {
  return {
    id: row.id,
    room: row.room,
    category: row.category,
    description: row.description,
    urgency: (row.urgency as TicketUrgency) ?? "Normal",
    reporter: row.reporter ?? "—",
    status: (row.status as TicketStatus) ?? "Open",
    date: row.created_at,
  };
}

/**
 * Maintenance ticket log: open, triage and resolve repair jobs per room.
 * Used on the front desk and housekeeping boards.
 */
export function MaintenanceTicketsPanel({
  reporter,
  reporterStaffId,
  defaultRoom,
  canEdit = true,
}: {
  reporter?: string | null;
  reporterStaffId?: string | null;
  defaultRoom?: string;
  canEdit?: boolean;
}) {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [filter, setFilter] = useState<TicketStatus | "All">("Open");
  const [room, setRoom] = useState(defaultRoom ?? "");
  const [category, setCategory] = useState<string>("General");
  const [urgency, setUrgency] = useState<TicketUrgency>("Normal");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .select("id, room, category, description, urgency, reporter, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Couldn't load maintenance tickets.");
    setTickets(((data ?? []) as Row[]).map(toTicket));
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("maintenance-tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maintenance_tickets" },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const visible = useMemo(
    () => tickets.filter((t) => (filter === "All" ? true : t.status === filter)),
    [tickets, filter],
  );

  async function create() {
    if (!room.trim() || !description.trim()) {
      toast.error("Room number and a short description are required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("maintenance_tickets").insert({
      room: room.trim(),
      category,
      description: description.trim(),
      urgency,
      reporter: reporter ?? null,
      reporter_staff_id: reporterStaffId ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't open the ticket.");
      return;
    }
    setDescription("");
    toast.success(`Ticket opened for room ${room.trim()}.`);
    await load();
  }

  async function setStatus(ticket: MaintenanceTicket, next: TicketStatus) {
    const { error } = await supabase
      .from("maintenance_tickets")
      .update({
        status: next,
        resolved_at: next === "Resolved" ? new Date().toISOString() : null,
      })
      .eq("id", ticket.id);
    if (error) {
      toast.error("Couldn't update the ticket.");
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: next } : t)));
  }

  return (
    <section className="mt-12 border border-cream/15 bg-cream/[0.04] p-6">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        Maintenance
      </p>
      <h2 className="mt-3 font-display text-2xl">Repair tickets</h2>
      <p className="mt-2 max-w-2xl text-sm text-cream/60">
        Log a broken item against a room, track it through triage and close it out when the fix is
        done.
      </p>

      {canEdit ? (
        <div className="mt-5 grid gap-3 border border-cream/15 bg-ink/40 p-4 md:grid-cols-[7rem_1fr_10rem_9rem_auto]">
          <Input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Room"
            inputMode="numeric"
            className="border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's broken?"
            className="border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 border border-cream/20 bg-ink px-3 text-sm text-cream"
          >
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
            className="h-10 border border-cream/20 bg-ink px-3 text-sm text-cream"
          >
            {TICKET_URGENCIES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <Button
            disabled={busy}
            onClick={() => void create()}
            className="bg-amber text-ink hover:bg-amber/90"
          >
            Open ticket
          </Button>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {(["Open", "In Progress", "Resolved", "All"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`signage border px-3 py-1.5 ${
              filter === option
                ? "border-amber bg-amber/15 text-amber"
                : "border-cream/20 text-cream/60 hover:border-cream/40"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="mt-6 text-sm text-cream/55">Loading tickets…</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-cream/55">No {filter.toLowerCase()} tickets right now.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {visible.map((ticket) => (
            <li
              key={ticket.id}
              className="flex flex-wrap items-center gap-3 border border-cream/15 bg-ink/40 px-4 py-3"
            >
              <span className="font-display text-lg">{ticket.room}</span>
              <span className="text-sm text-cream/80">{ticket.description}</span>
              <Badge className="bg-cream/10 text-[11px] text-cream/70">{ticket.category}</Badge>
              <Badge className={`text-[11px] ${URGENCY_BADGE[ticket.urgency]}`}>
                {ticket.urgency}
              </Badge>
              <Badge className={`text-[11px] ${STATUS_BADGE[ticket.status]}`}>
                {ticket.status}
              </Badge>
              <span className="text-[11px] text-cream/45">
                {ticket.reporter} · {new Date(ticket.date).toLocaleDateString()}
              </span>
              {canEdit ? (
                <span className="ml-auto flex gap-2">
                  {TICKET_STATUSES.filter((s) => s !== ticket.status).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      onClick={() => void setStatus(ticket, s)}
                      className="border-cream/25 bg-transparent text-xs text-cream/80 hover:bg-cream/10 hover:text-cream"
                    >
                      {s}
                    </Button>
                  ))}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

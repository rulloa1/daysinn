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
  Low: "bg-slate-100 text-slate-500",
  Normal: "bg-slate-100 text-slate-600",
  High: "bg-[#FBF0E2] text-[#B45309]",
  Urgent: "bg-[#B45309] text-white",
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  Open: "bg-[#FBF0E2] text-[#B45309]",
  "In Progress": "bg-[#E5F0F9] text-[#0065AB]",
  Resolved: "bg-[#E7F4EE] text-[#0F7B4F]",
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
    <section>
      <p className="signage flex items-center gap-2 text-brand-gold">
        <span aria-hidden className="h-3 w-[3px] bg-brand-gold" />
        Maintenance
      </p>
      <h2 className="mt-3 font-serif text-2xl font-bold text-brand-blue">Repair tickets</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Log a broken item against a room, track it through triage and close it out when the fix is
        done.
      </p>

      {canEdit ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[7rem_1fr_10rem_9rem_auto]">
          <Input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Room"
            inputMode="numeric"
            className="border-slate-300 bg-white text-slate-800 placeholder:text-slate-400"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's broken?"
            className="border-slate-300 bg-white text-slate-800 placeholder:text-slate-400"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
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
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
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
            className="bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
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
            className={`signage rounded-lg border px-3 py-1.5 transition ${
              filter === option
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="mt-6 text-sm text-slate-500">Loading tickets…</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No {filter.toLowerCase()} tickets right now.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {visible.map((ticket) => (
            <li
              key={ticket.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <span className="font-mono text-lg font-bold text-brand-blue">{ticket.room}</span>
              <span className="min-w-0 flex-1 text-sm text-slate-700">{ticket.description}</span>
              <Badge className="bg-slate-100 text-[11px] text-slate-600">{ticket.category}</Badge>
              <Badge className={`text-[11px] ${URGENCY_BADGE[ticket.urgency]}`}>
                {ticket.urgency}
              </Badge>
              <Badge className={`text-[11px] ${STATUS_BADGE[ticket.status]}`}>
                {ticket.status}
              </Badge>
              <span className="text-[11px] text-slate-400">
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
                      className="border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
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

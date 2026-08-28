import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayIso } from "@/lib/ops";
import type { BookingRow } from "./types";

const FIELD_CLASS = "border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35";

function emptyForm() {
  return {
    guest_name: "",
    room: "",
    phone: "",
    check_in: todayIso(),
    check_out: todayIso(),
    notes: "",
  };
}

function BookingList({
  title,
  rows,
  canEdit,
  onRemove,
}: {
  title: string;
  rows: BookingRow[];
  canEdit: boolean;
  onRemove: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <p className="signage text-cream/55">{title}</p>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-cream/45">Nothing here yet.</li>
        ) : (
          rows.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-cream/15 bg-cream/[0.03] px-4 py-3 text-sm"
            >
              <div>
                <p className="text-cream">
                  {b.guest_name} · Room {b.room}
                </p>
                <p className="text-xs text-cream/55">
                  {b.check_in} → {b.check_out}
                  {b.phone ? ` · ${b.phone}` : ""}
                  {b.notes ? ` · ${b.notes}` : ""}
                </p>
              </div>
              {canEdit ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cream/25 bg-transparent text-xs text-cream hover:bg-cream/10 hover:text-cream"
                  onClick={() => void onRemove(b.id)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function BookingsLog({
  bookings,
  canEdit,
  arrivals,
  departures,
}: {
  bookings: BookingRow[];
  canEdit: boolean;
  arrivals: BookingRow[];
  departures: BookingRow[];
}) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!form.guest_name.trim() || !form.room.trim()) {
      toast.error("Guest name and room number are required.");
      return;
    }
    if (form.check_out < form.check_in) {
      toast.error("Check-out can't be before check-in.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      guest_name: form.guest_name.trim(),
      room: form.room.trim(),
      phone: form.phone.trim() || null,
      check_in: form.check_in,
      check_out: form.check_out,
      notes: form.notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't save that booking.");
      return;
    }
    toast.success("Booking added.");
    setForm(emptyForm());
  }

  async function remove(id: string) {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't remove that booking.");
      return;
    }
    toast.success("Booking removed.");
  }

  return (
    <section className="mt-12 border-t border-cream/15 pt-8">
      <p className="signage flex items-center gap-2 text-cream/60">
        <span aria-hidden className="h-3 w-[3px] bg-amber" />
        Bookings log
      </p>
      <h2 className="mt-3 text-3xl">
        {bookings.length} booking{bookings.length === 1 ? "" : "s"} on file
      </h2>

      {canEdit ? (
        <div className="mt-6 grid gap-3 border border-cream/15 bg-cream/[0.03] p-4 md:grid-cols-3 xl:grid-cols-6">
          <Input
            value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            placeholder="Guest name"
            className={FIELD_CLASS}
          />
          <Input
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            placeholder="Room"
            className={FIELD_CLASS}
          />
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone (optional)"
            className={FIELD_CLASS}
          />
          <Input
            type="date"
            aria-label="Check-in date"
            value={form.check_in}
            onChange={(e) => setForm({ ...form, check_in: e.target.value })}
            className={FIELD_CLASS}
          />
          <Input
            type="date"
            aria-label="Check-out date"
            value={form.check_out}
            onChange={(e) => setForm({ ...form, check_out: e.target.value })}
            className={FIELD_CLASS}
          />
          <Input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes (optional)"
            className={FIELD_CLASS}
          />
          <Button
            className="bg-amber text-ink hover:bg-amber/90 md:col-span-3 xl:col-span-2"
            disabled={busy}
            onClick={() => void add()}
          >
            Add booking
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BookingList title="Arriving today" rows={arrivals} canEdit={false} onRemove={remove} />
        <BookingList title="Departing today" rows={departures} canEdit={false} onRemove={remove} />
      </div>

      <div className="mt-6">
        <BookingList
          title="All bookings"
          rows={[...bookings].sort((a, b) => a.check_in.localeCompare(b.check_in))}
          canEdit={canEdit}
          onRemove={remove}
        />
      </div>
    </section>
  );
}

import { useState } from "react";
import { Sparkles, Check, Clock, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestSchema } from "@/lib/request-schema";
import type { ServiceRequest } from "./content";

const TIME_WINDOWS = [
  { id: "now", label: "Right now", note: "Dispatch immediately" },
  { id: "1hr", label: "Within 1 hour", note: "Standard turnaround" },
  { id: "afternoon", label: "This afternoon", note: "Best after 2:00 PM" },
];

export function RequestDialog({
  request,
  onClose,
}: {
  request: ServiceRequest | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form" | "sending" | "sent">("form");
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const [selectedWindow, setSelectedWindow] = useState("now");
  const [details, setDetails] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({
    "Bath Towels": 2,
    "Extra Pillows": 1,
    "Hand Towels": 2,
  });

  const isLinenRequest =
    request?.id === "towels" ||
    request?.label.toLowerCase().includes("towel") ||
    request?.label.toLowerCase().includes("linen");

  function adjustCount(item: string, delta: number) {
    setItemCounts((prev) => ({
      ...prev,
      [item]: Math.max(0, (prev[item] ?? 0) + delta),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!request) return;

    let compiledDetails = details.trim();
    if (isLinenRequest) {
      const itemsList = Object.entries(itemCounts)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => `${count}x ${name}`)
        .join(", ");
      compiledDetails = itemsList
        ? `${itemsList}${compiledDetails ? ` · ${compiledDetails}` : ""}`
        : compiledDetails;
    }

    const windowLabel = TIME_WINDOWS.find((w) => w.id === selectedWindow)?.label;
    if (windowLabel) {
      compiledDetails = `${compiledDetails ? `${compiledDetails} ` : ""}(Timing: ${windowLabel})`;
    }

    const parsed = requestSchema.safeParse({ room, guest_name: name, details: compiledDetails });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message = issue?.message ?? "Please check your details.";
      if (issue?.path[0] === "room") setRoomError(message);
      toast.error(message);
      return;
    }

    setRoomError(null);
    setStep("sending");

    const { error } = await supabase.from("requests").insert({
      room: parsed.data.room,
      guest_name: parsed.data.guest_name || null,
      type: request.label,
      details: parsed.data.details || null,
    });

    if (error) {
      setStep("form");
      if (error.code === "23514") {
        setRoomError("Enter a valid room number.");
        toast.error("Enter a valid room number.");
        return;
      }
      toast.error("We couldn't send that. Please call the front desk at (352) 748-7766.");
      return;
    }

    setStep("sent");
    toast.success("Request received by front desk.");
  }

  function handleClose() {
    setStep("form");
    setRoom("");
    setName("");
    setDetails("");
    onClose();
  }

  return (
    <Dialog open={request !== null} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="max-w-md rounded-3xl border border-[#D2DBE6] bg-white p-6 shadow-2xl">
        {step === "form" ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#004986] text-white">
                  <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                </span>
                <div>
                  <DialogTitle className="font-serif text-lg font-bold text-[#004986]">
                    {request?.label}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {request?.prompt}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="room" className="text-xs font-bold text-slate-700">
                    Room Number *
                  </Label>
                  <Input
                    id="room"
                    value={room}
                    placeholder="e.g. 214"
                    maxLength={10}
                    onChange={(event) => {
                      setRoom(event.target.value);
                      if (roomError) setRoomError(null);
                    }}
                    className="h-11 rounded-xl border-[#BCC9D8] font-mono text-base font-bold text-[#004986]"
                    required
                  />
                  {roomError ? (
                    <p className="text-[10px] font-medium text-rose-600">{roomError}</p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-700">
                    Last Name (Optional)
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    maxLength={80}
                    placeholder="e.g. Whitfield"
                    onChange={(event) => setName(event.target.value)}
                    className="h-11 rounded-xl border-[#BCC9D8] text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Item quantities for linen requests */}
              {isLinenRequest ? (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Select Items Needed</Label>
                  <div className="space-y-2">
                    {Object.entries(itemCounts).map(([item, count]) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2"
                      >
                        <span className="text-xs font-semibold text-slate-800">{item}</span>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => adjustCount(item, -1)}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-300 bg-white font-mono text-sm font-bold text-slate-700 hover:bg-slate-100"
                          >
                            −
                          </button>
                          <span className="min-w-4 text-center font-mono text-xs font-bold text-[#004986]">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustCount(item, 1)}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-300 bg-white font-mono text-sm font-bold text-[#004986] hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Preferred Time Window */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Preferred Timing</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_WINDOWS.map((win) => {
                    const isSelected = selectedWindow === win.id;
                    return (
                      <button
                        key={win.id}
                        type="button"
                        onClick={() => setSelectedWindow(win.id)}
                        className={`rounded-xl border p-2.5 text-left transition ${
                          isSelected
                            ? "border-[#004986] bg-[#E5F0F9] text-[#004986]"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-xs font-bold">{win.label}</p>
                        <p className="text-[10px] text-slate-400">{win.note}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="details" className="text-xs font-bold text-slate-700">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="details"
                  value={details}
                  maxLength={500}
                  rows={2}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="e.g. Leave outside room door if we're not answering"
                  className="rounded-xl border-[#BCC9D8] text-xs text-slate-800 resize-none"
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#004986] text-xs font-bold text-white shadow-md transition hover:bg-[#004986]/90 active:scale-[0.98]"
              >
                Send request to desk
              </Button>
            </form>
          </>
        ) : step === "sending" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-3 border-[#004986] border-t-transparent" />
            <p className="mt-4 font-serif text-lg font-bold text-[#004986]">
              Sending to front desk…
            </p>
          </div>
        ) : (
          /* Sent Confirmation View */
          <div className="flex flex-col items-center py-4 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#D4AF37] text-[#004986] shadow-md">
              <Check className="h-7 w-7 stroke-[2.5]" />
            </div>

            <h3 className="mt-4 font-serif text-2xl font-bold text-[#004986]">We've got it</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Your request for Room {room} has been dispatched to on-duty staff.
            </p>

            <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Service Standard</span>
                <span className="font-bold text-emerald-600">~10 min turnaround</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                You can track status in real-time under <strong>Track a request</strong>.
              </div>
            </div>

            <Button
              type="button"
              onClick={handleClose}
              className="mt-6 h-11 w-full rounded-xl bg-[#004986] text-xs font-bold text-white shadow-sm"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

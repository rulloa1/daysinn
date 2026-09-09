import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STATUS_COLORS, type PropertyRoomData, type RoomStatusType } from "./property-aerial-types";
import { Sparkles, AlertCircle, CheckCircle, Clock, User, FileText } from "lucide-react";
import { toast } from "sonner";

interface RoomActionDialogProps {
  room: PropertyRoomData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (
    roomNumber: string,
    status: RoomStatusType,
    housekeeper?: string,
    notes?: string,
  ) => void;
}

export function RoomActionDialog({
  room,
  open,
  onOpenChange,
  onUpdateStatus,
}: RoomActionDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<RoomStatusType>("Clean");
  const [housekeeper, setHousekeeper] = useState("Maria Santos");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (room) {
      setSelectedStatus(room.status);
      setHousekeeper(room.housekeeper || "Maria Santos");
      setNotes(room.notes || "");
    }
  }, [room]);

  if (!room) return null;

  const handleSave = () => {
    onUpdateStatus(room.number, selectedStatus, housekeeper, notes);
    toast.success(`Room ${room.number} updated to ${selectedStatus}`);
    onOpenChange(false);
  };

  const statuses: RoomStatusType[] = [
    "Clean",
    "Dirty",
    "Inspected",
    "Out of Order",
    "Occupied",
    "Vacant",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl shadow-2xl border border-slate-200">
        <DialogHeader>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Room {room.number}
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {room.type} • Floor {room.floor}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold shadow-2xs"
              style={{
                backgroundColor: STATUS_COLORS[room.status].pillBg,
                color: STATUS_COLORS[room.status].pillText,
              }}
            >
              Current: {room.status}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Status Selection Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Update Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statuses.map((status) => {
                const colors = STATUS_COLORS[status];
                const isCurrent = selectedStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center justify-center gap-1"
                    style={{
                      backgroundColor: isCurrent ? colors.bg : colors.lightBg,
                      color: colors.text,
                      borderColor: isCurrent ? colors.border : "transparent",
                      boxShadow: isCurrent ? "0 0 0 2px #00244e" : "none",
                    }}
                  >
                    <span>{status}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Housekeeper */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Assigned Housekeeper
            </label>
            <select
              value={housekeeper}
              onChange={(e) => setHousekeeper(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00244e]/20"
            >
              <option value="Maria Santos">Maria Santos (Lead)</option>
              <option value="Elena Rostova">Elena Rostova</option>
              <option value="Carmen Diaz">Carmen Diaz</option>
              <option value="Sofia Perez">Sofia Perez</option>
              <option value="Angela Wright">Angela Wright</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Housekeeping / Maintenance Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra towels requested, AC filter cleaned..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00244e]/20"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-[#00244e] hover:bg-[#001738] text-white text-xs font-bold"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

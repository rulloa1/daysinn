import { useMemo } from "react";
import { northWing, westWingColumns, cornerRoom, type FloorKey } from "@/lib/property-layout";
import { Waves, MapPin } from "lucide-react";

type RoomStatus =
  | "vacant_clean"
  | "vacant_dirty"
  | "occupied"
  | "occupied_dnd"
  | "out_of_order"
  | "reserved";

export type MapRoom = {
  id: string;
  number: string;
  status: RoomStatus;
  guest_name?: string | null;
};

export type FloorView = FloorKey | "both";

const TILE: Record<RoomStatus, string> = {
  vacant_clean: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30",
  vacant_dirty: "border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/30",
  occupied: "border-blue-500/50 bg-blue-500/15 text-blue-300 hover:bg-blue-500/30",
  occupied_dnd: "border-purple-500/50 bg-purple-500/15 text-purple-300 hover:bg-purple-500/30",
  reserved: "border-cyan-500/50 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/30",
  out_of_order: "border-rose-500/50 bg-rose-500/15 text-rose-300 hover:bg-rose-500/30",
};

type Props = {
  floor: FloorView;
  rooms: MapRoom[];
  openRequests?: Map<string, number> | undefined;
  dimmed?: Set<string> | undefined;
  onSelect: (roomId: string) => void;
};

export function FloorPlan({ floor, rooms, openRequests, dimmed, onSelect }: Props) {
  const byNumber = useMemo(() => {
    const map = new Map<string, MapRoom>();
    for (const room of rooms) map.set(room.number, room);
    return map;
  }, [rooms]);

  const both = floor === "both";
  const layoutFloor: FloorKey = both ? 1 : floor;
  const north = northWing(layoutFloor);
  const west = westWingColumns(layoutFloor);
  const corner = cornerRoom(layoutFloor);

  function Slot({ number }: { number: string }) {
    const room = byNumber.get(number);
    if (!room) {
      return (
        <div className="grid place-items-center rounded border border-white/10 bg-white/[0.03] px-1 py-1.5 text-center text-[10px] font-mono text-white/30">
          {number}
        </div>
      );
    }
    const open = openRequests?.get(number) ?? 0;
    const faded = dimmed?.size ? !dimmed.has(number) : false;
    return (
      <button
        type="button"
        onClick={() => onSelect(room.id)}
        title={`Room ${number} · ${room.guest_name ?? "Vacant"} (${room.status.replace("_", " ")})`}
        className={`relative w-full rounded border px-1.5 py-1.5 text-center text-[11px] font-bold leading-none transition-all duration-150 ${
          TILE[room.status]
        } ${faded ? "opacity-25" : "shadow-sm"}`}
      >
        <span>{number}</span>
        {open ? (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[9px] font-black text-slate-950 shadow-sm"
          >
            {open}
          </span>
        ) : null}
      </button>
    );
  }

  /** In "both" mode each map position stacks the ground-floor room over the one above it. */
  function Tile({ number }: { number: string }) {
    if (both) {
      const upstairs = String(Number(number) + 100);
      if (byNumber.has(upstairs)) {
        return (
          <div className="grid gap-[3px]">
            <Slot number={number} />
            <Slot number={upstairs} />
          </div>
        );
      }
    }
    return <Slot number={number} />;
  }

  const Space = ({ label, className = "" }: { label: string; className?: string }) => (
    <div
      className={`grid place-items-center rounded border border-white/10 bg-white/[0.05] p-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-300 ${className}`}
    >
      {label}
    </div>
  );

  const ZoneLabel = ({ label, className = "" }: { label: string; className?: string }) => (
    <div
      className={`flex items-center justify-center rounded-lg border border-dashed border-white/10 bg-slate-900/60 px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 ${className}`}
    >
      {label}
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl">
      <div className="min-w-[880px] space-y-3">
        <ZoneLabel
          label="Truck parking · FL-44 highway frontage"
          className="border-amber-500/20 bg-slate-900/90 text-amber-300"
        />

        {/* NORTH WING: outer row faces the highway, inner row faces the courtyard */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              North wing
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400">
              <MapPin className="h-3 w-3" /> Lobby entrance at the elbow
            </span>
          </div>

          <div className="flex items-start gap-3">
            {/* Corner unit at the elbow of the L */}
            <div className="w-20 shrink-0 space-y-1 rounded-lg border border-white/10 bg-slate-950/60 p-2">
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Corner
              </div>
              <Tile number={corner} />
            </div>

            <div className="flex-1 space-y-2">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${north.outer.length}, minmax(0, 1fr))` }}
              >
                {north.outer.map((num) => (
                  <Tile key={num} number={num} />
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1">
                <Space label="Lobby / Registration" className="col-span-2" />
                <Space label="Breakfast" />
                <Space label="Laundry" />
                <Space label="Facility" />
                <Space label="Stairs" />
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${north.inner.length}, minmax(0, 1fr))` }}
              >
                {north.inner.map((num) => (
                  <Tile key={num} number={num} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* WEST WING + COURTYARD */}
        <div className="flex items-stretch gap-3">
          <ZoneLabel label="Guest parking" className="w-10 [writing-mode:vertical-rl]" />

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              West wing
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="space-y-1">
                {west.outer.map((num) => (
                  <Tile key={num} number={num} />
                ))}
              </div>
              <div className="space-y-1">
                {west.inner.map((num) => (
                  <Tile key={num} number={num} />
                ))}
              </div>
            </div>
          </div>

          {/* Courtyard */}
          <div className="flex flex-1 flex-col gap-3 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
            <div className="grid h-40 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300">
                <Waves className="h-4 w-4" /> Swimming pool
              </div>
            </div>
            <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-emerald-700/40 text-[10px] font-black uppercase tracking-widest text-emerald-600/80">
              Lawn / Courtyard
            </div>
          </div>
        </div>

        <ZoneLabel label="Rear parking & service yard" />

        <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {(
            [
              ["vacant_clean", "Vacant clean"],
              ["vacant_dirty", "Vacant dirty"],
              ["occupied", "Occupied"],
              ["occupied_dnd", "DND"],
              ["reserved", "Reserved"],
              ["out_of_order", "Out of order"],
            ] as [RoomStatus, string][]
          ).map(([status, label]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded border ${TILE[status]}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

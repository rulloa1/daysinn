import { useEffect, useMemo, useRef, useState } from "react";
import { cornerRoom, northWing, westWing, type FloorKey } from "@/lib/property-layout";
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

/**
 * Color-coded map of the property, laid out like the aerial photo: an
 * L-shaped block with the north wing across the top, the west wing down the
 * left, and the pool courtyard in the middle.
 */
export function FloorPlan({ floor, rooms, openRequests, dimmed, onSelect }: Props) {
  const byNumber = useMemo(() => {
    const map = new Map<string, MapRoom>();
    for (const room of rooms) map.set(room.number, room);
    return map;
  }, [rooms]);

  const both = floor === "both";
  const layoutFloor: FloorKey = both ? 1 : floor;
  const north = northWing(layoutFloor);
  const west = westWing(layoutFloor);
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
      className={`grid place-items-center rounded border border-white/10 bg-white/[0.05] px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-slate-300 ${className}`}
    >
      {label}
    </div>
  );

  const Strip = ({ label, className = "" }: { label: string; className?: string }) => (
    <div
      className={`rounded border border-dashed border-white/10 bg-slate-900/70 py-1 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ${className}`}
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

  const columns = `repeat(${north.length}, minmax(0, 1fr))`;

  // The plan is drawn at a fixed width so the wings keep the proportions of the
  // aerial photo, then scaled down to whatever space the dashboard gives it.
  const PLAN_WIDTH = 1000;
  const frameRef = useRef<HTMLDivElement | null>(null);
  const planRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [planHeight, setPlanHeight] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    const plan = planRef.current;
    if (!frame || !plan) return;
    const measure = () => {
      const available = frame.clientWidth;
      setScale(Math.min(1, available / PLAN_WIDTH));
      setPlanHeight(plan.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(plan);
    return () => observer.disconnect();
  }, [both, floor, rooms.length]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl">
      <div
        ref={frameRef}
        className="overflow-hidden"
        style={{ height: planHeight ? planHeight * scale : undefined }}
      >
        <div
          ref={planRef}
          className="space-y-3"
          style={{
            width: PLAN_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
        <ZoneLabel
          label="Rear parking · FL-44 highway frontage"
          className="border-amber-500/20 bg-slate-900/90 text-amber-300"
        />

        {/* NORTH WING — back row faces the rear parking, front row faces the courtyard */}
        <div className="flex items-stretch gap-3">
          <div className="w-[150px] shrink-0 space-y-1 rounded-xl border border-slate-800 bg-slate-900/80 p-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Lobby</span>
              <span className="flex items-center gap-1 text-rose-400">
                <MapPin className="h-3 w-3" /> You are here
              </span>
            </div>
            <Space label="Lobby / Registration" className="py-3" />
            <div className="grid grid-cols-2 gap-1">
              <Space label="GM Office" />
              <Space label="Kitchen" />
            </div>
            <Tile number={corner} />
          </div>

          <div className="flex-1 space-y-1 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>North wing</span>
              <span className="text-slate-500">Stairs at both ends</span>
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: columns }}>
              {north.map(([back]) => (
                <Tile key={back} number={back} />
              ))}
            </div>
            <Strip label="Interior corridor / breezeway" />
            <div className="grid gap-1" style={{ gridTemplateColumns: columns }}>
              {north.map(([, front]) => (
                <Tile key={front} number={front} />
              ))}
            </div>
          </div>
        </div>

        {/* WEST WING + COURTYARD */}
        <div className="flex items-stretch gap-3">
          <ZoneLabel label="Guest parking" className="w-9 [writing-mode:vertical-rl]" />

          <div className="w-[220px] shrink-0 space-y-1 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              West wing
            </div>
            {west.map(([outer, inner]) => (
              <div key={outer} className="grid grid-cols-2 gap-1">
                <Tile number={outer} />
                <Tile number={inner} />
              </div>
            ))}
            <Strip label="Stairs" />
            <div className="grid grid-cols-2 gap-1">
              <Space label="Facility" />
              <Space label="Guest Laundry" />
            </div>
            <Space label="Laundry & Storage" />
          </div>

          <div className="flex flex-1 flex-col gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
            <div className="grid h-36 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300">
                <Waves className="h-4 w-4" /> Swim pool
              </div>
            </div>
            <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-emerald-700/40 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-600/80">
              Lawn / Courtyard
            </div>
          </div>
        </div>

        <ZoneLabel label="Overflow parking" />
      </div>
    </div>
  );
}

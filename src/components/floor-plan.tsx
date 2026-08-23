import { useMemo } from "react";
import {
  frontRows,
  rearRows,
  LOBBY_UPSTAIRS_WEST,
  LOBBY_UPSTAIRS_EAST,
  EXTRA_UPSTAIRS,
  type FloorKey,
} from "@/lib/property-layout";
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
  const front = frontRows(layoutFloor);
  const rear = rearRows(layoutFloor);
  const showLobbyRooms = both || floor === 2;

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

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl">
      <div className="min-w-[900px] space-y-3">
        <ZoneLabel
          label="Truck parking · FL-44 highway frontage"
          className="border-amber-500/20 bg-slate-900/90 text-amber-300"
        />

        <div className="flex items-stretch gap-3">
          <ZoneLabel label="Parking" className="w-9 [writing-mode:vertical-rl]" />

          {/* FRONT BLOCK — lobby at the north end, rooms running south */}
          <div className="w-[300px] shrink-0 space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Front block
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                <MapPin className="h-3 w-3" /> You are here
              </span>
            </div>

            <Strip label="Breezeway // Stairs" />

            {/* Lobby / office block with the 200-level rooms above it */}
            <div className="grid grid-cols-[1fr_1fr_64px] gap-1">
              <div className="col-span-2 space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <Space label="GM Office" />
                  <Space label="Kitchen" />
                </div>
                <Space label="Lobby / Registration" className="py-3" />
                <Space label="Breakfast" />
                <div className="grid grid-cols-2 gap-1">
                  <Space label="Security" />
                  <Tile number={front.solo} />
                </div>
              </div>
              <div className="space-y-1">
                {showLobbyRooms
                  ? LOBBY_UPSTAIRS_EAST.map((n) => <Slot key={n} number={String(n)} />)
                  : LOBBY_UPSTAIRS_EAST.map((n) => (
                      <Space key={n} label="—" className="opacity-40" />
                    ))}
              </div>
            </div>

            {/* Room rows: odd on the parking side, even on the courtyard side */}
            <div className="space-y-1">
              {front.north.map(([odd, even]) => (
                <div key={odd} className="grid grid-cols-2 gap-1">
                  <Tile number={odd} />
                  <Tile number={even} />
                </div>
              ))}
            </div>

            <Strip label="Breezeway // Stairs" />

            <div className="space-y-1">
              {front.south.map(([odd, even]) => (
                <div key={odd} className="grid grid-cols-2 gap-1">
                  <Tile number={odd} />
                  <Tile number={even} />
                </div>
              ))}
            </div>

            <Strip label="Breezeway" />

            <div className="grid grid-cols-2 gap-1">
              <Space label="Facility" />
              <Space label="Guest Laundry" />
            </div>
            <Space label="Laundry & Storage" />
          </div>

          {/* EAST SIDE — upstairs lobby rooms, pool courtyard, parking, rear block */}
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-16 shrink-0 space-y-1">
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Upstairs
                </div>
                {showLobbyRooms
                  ? LOBBY_UPSTAIRS_WEST.map((n) => <Slot key={n} number={String(n)} />)
                  : LOBBY_UPSTAIRS_WEST.map((n) => (
                      <Space key={n} label="—" className="opacity-40" />
                    ))}
              </div>
              <div className="flex flex-1 flex-col gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
                <div className="grid h-32 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300">
                    <Waves className="h-4 w-4" /> Swim pool
                  </div>
                </div>
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-emerald-700/40 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600/80">
                  Lawn / Courtyard
                </div>
              </div>
            </div>

            <ZoneLabel label="Parking" />

            {/* REAR BLOCK */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Rear block</span>
                <span className="text-slate-500">Stairs at both ends</span>
              </div>
              <div className="flex items-stretch gap-2">
                <Strip label="Stairs" className="w-7 [writing-mode:vertical-rl] py-2" />
                <div className="flex-1 space-y-2">
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${rear.north.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {rear.north.map((num) => (
                      <Tile key={num} number={num} />
                    ))}
                  </div>
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${rear.south.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {rear.south.map((num) => (
                      <Tile key={num} number={num} />
                    ))}
                  </div>
                </div>
                {showLobbyRooms ? (
                  <div className="w-12 shrink-0 self-end">
                    <Slot number={EXTRA_UPSTAIRS} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <ZoneLabel label="Truck parking · rear yard" />

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

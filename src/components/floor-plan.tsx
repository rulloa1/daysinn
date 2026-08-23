import { useMemo } from "react";
import {
  frontBlock,
  southBuilding,
  westWing,
  SERVICE_SPACES,
  type FloorKey,
} from "@/lib/property-layout";
import { Waves, Sparkles, MapPin } from "lucide-react";

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
  const wing = westWing(layoutFloor);
  const south = southBuilding(layoutFloor);
  const front = frontBlock(layoutFloor);

  function Slot({ number, size = "md" }: { number: string; size?: "md" | "sm" }) {
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
        className={`relative w-full rounded border text-center font-bold leading-none transition-all duration-150 ${
          TILE[room.status]
        } ${size === "sm" ? "px-1 py-1.5 text-[11px]" : "px-2 py-2 text-xs"} ${
          faded ? "opacity-25" : "shadow-sm"
        }`}
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

  function Tile({ number, stack = true }: { number: string; size?: "md" | "sm"; stack?: boolean }) {
    if (both && number !== "108") {
      const base = Number(number);
      const upstairs = base < 200 ? String(base + 100) : null;
      if (upstairs && byNumber.has(upstairs)) {
        return (
          <div className={`grid gap-1 ${stack ? "" : "grid-cols-2"}`}>
            <Slot number={number} size="sm" />
            <Slot number={upstairs} size="sm" />
          </div>
        );
      }
    }
    return <Slot number={number} size="sm" />;
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
      className={`flex items-center justify-center rounded-lg border border-dashed border-white/10 bg-slate-900/60 py-1.5 px-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase ${className}`}
    >
      {label}
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl">
      <div className="min-w-[840px] space-y-3">
        {/* TOP PERIMETER: TRUCK PARKING */}
        <ZoneLabel label="TRUCK PARKING (FL-44 HIGHWAY FRONTAGE)" className="bg-slate-900/90 text-amber-300 border-amber-500/20" />

        {/* TOP MAIN BUILDING: UPSTAIRS ROOMS + LOBBY/OFFICES + ROOMS 200-208 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Top Main Building (Lobby, Offices, Breakfast & Upper Rooms)
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400">
              <MapPin className="h-3 w-3" /> Room 205 (Main Entrance Point)
            </span>
          </div>

          <div className="grid grid-cols-[1.2fr_2fr_1fr] gap-2">
            {/* Top-Left Upstairs Rooms */}
            <div className="space-y-1 rounded-lg border border-white/10 bg-slate-950/60 p-2">
              <div className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                Upstairs (201–209)
              </div>
              <div className="grid grid-cols-5 gap-1">
                {front.upstairsLeft.map((num) => (
                  <div key={num} className="relative">
                    <Slot number={num} size="sm" />
                    {num === "205" && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-rose-500 px-1 text-[8px] font-bold text-white">
                        HERE
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center text-[9px] text-slate-500">Breezeway // Stairs</div>
            </div>

            {/* Middle Services Downstairs */}
            <div className="grid grid-cols-6 gap-1 rounded-lg border border-white/10 bg-slate-950/60 p-2">
              {front.services.map((cell, i) =>
                cell.kind === "room" ? (
                  <Slot key={cell.number} number={cell.number} size="sm" />
                ) : (
                  <Space
                    key={`${cell.label}-${i}`}
                    label={cell.label}
                    className={cell.wide ? "col-span-2" : ""}
                  />
                ),
              )}
            </div>

            {/* Right Rooms (200–208) */}
            <div className="space-y-1 rounded-lg border border-white/10 bg-slate-950/60 p-2">
              <div className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                Rooms 200–208
              </div>
              <div className="grid grid-cols-5 gap-1">
                {front.upstairsRight.map((num) => (
                  <Slot key={num} number={num} size="sm" />
                ))}
              </div>
              <div className="text-center text-[9px] text-slate-500">Security // Access</div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: WEST WING (LEFT) + SWIM POOL & PARKING (RIGHT) */}
        <div className="grid grid-cols-[1.1fr_2.5fr_0.4fr] gap-3">
          {/* WEST WING (VERTICAL TWO-STORY BUILDING) */}
          <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>WEST WING</span>
              <span className="text-[9px] text-slate-500">Outer | Pool View</span>
            </div>

            <div className="space-y-1">
              {wing.map((row, i) =>
                row.kind === "divider" ? (
                  <div
                    key={`div-${i}`}
                    className="rounded border border-dashed border-amber-500/30 bg-amber-500/5 py-1 text-center text-[9px] font-black tracking-widest text-amber-300 uppercase"
                  >
                    {row.label}
                  </div>
                ) : (
                  <div key={row.left} className="grid grid-cols-2 gap-1">
                    <Tile number={row.right} size="sm" stack={false} />
                    <Tile number={row.left} size="sm" stack={false} />
                  </div>
                ),
              )}

              {/* Service & Storage at Bottom */}
              <div className="mt-2 space-y-1 border-t border-white/10 pt-1.5">
                <div className="grid grid-cols-2 gap-1">
                  <Space label="Facility" className="py-1 text-[9px]" />
                  <Space label="GST Laundry" className="py-1 text-[9px]" />
                </div>
                <Space label="Laundry and Storage" className="py-1 text-[9px]" />
              </div>
            </div>
          </div>

          {/* COURTYARD SWIM POOL & CENTRAL PARKING */}
          <div className="flex flex-col justify-between space-y-3">
            {/* SWIM POOL */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-600/30 via-cyan-600/20 to-blue-900/40 p-6 text-center shadow-lg">
              <div className="absolute top-2 left-3 flex items-center gap-1 text-[10px] font-bold tracking-wider text-cyan-300 uppercase">
                <Waves className="h-3.5 w-3.5" /> Central Courtyard
              </div>
              <div className="my-3 flex flex-col items-center justify-center">
                <div className="rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-8 py-4 backdrop-blur-md">
                  <h3 className="font-serif text-lg font-bold text-cyan-100 tracking-wide">
                    SWIM POOL
                  </h3>
                  <p className="text-[10px] text-cyan-200/80">Outdoor Heated Pool & Sun Deck</p>
                </div>
              </div>
            </div>

            {/* CENTRAL PARKING */}
            <ZoneLabel
              label="PARKING (MAIN COURTYARD GUEST PARKING)"
              className="flex-1 py-8 text-sm font-black text-slate-300"
            />
          </div>

          {/* RIGHT MARGIN TRUCK PARKING */}
          <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-900/60 p-2 text-center [writing-mode:vertical-rl]">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              TRUCK PARKING
            </span>
          </div>
        </div>

        {/* SOUTH HORIZONTAL BUILDING (BOTTOM WING) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              South Horizontal Building (Rooms 136–163 / 236–265)
            </span>
            <div className="flex gap-3 text-[9px] font-semibold text-slate-400">
              <span className="rounded bg-white/10 px-1.5 py-0.5">Top Row: Courtyard Facing</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5">Bottom Row: Parking Facing</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            {/* Left Stairs */}
            <div className="grid w-8 shrink-0 place-items-center rounded border border-amber-500/30 bg-amber-500/10 text-[9px] font-black tracking-widest text-amber-300 uppercase [writing-mode:vertical-rl]">
              STAIRS
            </div>

            <div className="flex-1 space-y-1.5">
              {/* Top Row (Courtyard Facing) */}
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${south.top.length}, minmax(0,1fr))` }}
              >
                {south.top.map((num) => (
                  <Tile key={num} number={num} size="sm" />
                ))}
              </div>

              {/* Central Corridor */}
              <div className="h-2 rounded bg-slate-950/80 text-center text-[7px] font-mono text-slate-600">
                CORRIDOR // BREEZEWAY
              </div>

              {/* Bottom Row (Outer Facing) */}
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${south.bottom.length}, minmax(0,1fr))` }}
              >
                {south.bottom.map((num) => (
                  <Tile key={num} number={num} size="sm" />
                ))}
              </div>
            </div>

            {/* Right Stairs */}
            <div className="grid w-8 shrink-0 place-items-center rounded border border-amber-500/30 bg-amber-500/10 text-[9px] font-black tracking-widest text-amber-300 uppercase [writing-mode:vertical-rl]">
              STAIRS
            </div>
          </div>
        </div>

        {/* BOTTOM PERIMETER: PARKING & TRUCK PARKING */}
        <div className="grid grid-cols-2 gap-2">
          <ZoneLabel label="PARKING (SOUTH GUEST PARKING)" />
          <ZoneLabel label="TRUCK PARKING (REAR PERIMETER)" className="text-amber-300 border-amber-500/20" />
        </div>
      </div>
    </div>
  );
}

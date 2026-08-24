import { useMemo } from "react";
import { frontBlock, northBuilding, westWing, type FloorKey } from "@/lib/property-layout";
import { Waves, MapPin, Snowflake, Car, Truck } from "lucide-react";

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
 * Architectural interactive floor plan of Days Inn Wildwood (551 FL-44),
 * directly mirroring the aerial blueprint overlay:
 * - Top-Left Corner: Lobby, Registration, Breakfast, GM Office, Kitchen, Security, Room 108/208, Ice machine.
 * - North Wing (Top Horizontal): Even outer rooms 136-162 & Odd inner rooms 137-163/265 with breezeway stairs.
 * - West Wing (Left Vertical): Outer parking 111-135 & Inner courtyard 110-134, breezeways, facility, vending, laundry & storage.
 * - Central Courtyard: Heated Swim Pool & central courtyard parking stalls.
 * - Perimeter: North truck parking along FL-44, East guest parking driveway, South truck parking.
 */
export function FloorPlan({ floor, rooms, openRequests, dimmed, onSelect }: Props) {
  const byNumber = useMemo(() => {
    const map = new Map<string, MapRoom>();
    for (const room of rooms) map.set(room.number, room);
    return map;
  }, [rooms]);

  const both = floor === "both";
  const layoutFloor: FloorKey = both ? 1 : floor;
  const north = northBuilding(layoutFloor);
  const northF2 = northBuilding(2);
  const wing = westWing(layoutFloor);
  const front = frontBlock(layoutFloor);

  function Slot({ number, size = "md" }: { number: string; size?: "sm" | "md" }) {
    const room = byNumber.get(number);
    if (!room) {
      return (
        <div
          className={`grid place-items-center rounded border border-white/10 bg-white/[0.03] text-center font-mono text-white/30 ${
            size === "sm" ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-1 text-xs"
          }`}
        >
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
        className={`relative w-full rounded border font-bold leading-none transition-all duration-150 ${
          size === "sm" ? "px-1 py-1 text-[10px]" : "px-1.5 py-1.5 text-xs"
        } ${TILE[room.status]} ${faded ? "opacity-25" : "shadow-sm hover:scale-[1.03] cursor-pointer"}`}
      >
        <span className="font-mono">{number}</span>
        {open > 0 && (
          <span className="absolute -top-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow">
            {open}
          </span>
        )}
      </button>
    );
  }

  function StackedPair({
    floor1Num,
    floor2Num,
    size = "sm",
  }: {
    floor1Num: string;
    floor2Num: string;
    size?: "sm" | "md";
  }) {
    if (!both) {
      const activeNum = floor === 2 ? floor2Num : floor1Num;
      return <Slot number={activeNum} size={size} />;
    }

    return (
      <div className="flex flex-col gap-0.5">
        <Slot number={floor1Num} size="sm" />
        <div className="h-[1px] bg-white/10" />
        <Slot number={floor2Num} size="sm" />
      </div>
    );
  }

  function Space({ label, className = "" }: { label: string; className?: string }) {
    return (
      <div
        className={`grid place-items-center rounded border border-dashed border-white/15 bg-white/[0.04] p-1 text-center text-[10px] font-semibold text-slate-300 ${className}`}
      >
        {label}
      </div>
    );
  }

  function ZoneLabel({
    label,
    icon: Icon,
    className = "",
  }: {
    label: string;
    icon?: typeof Truck | typeof Car;
    className?: string;
  }) {
    return (
      <div
        className={`flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-slate-900/40 p-2 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase ${className}`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 opacity-70" />}
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-2xl">
      {/* MAP HEADER */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span className="font-serif text-sm font-bold text-white tracking-wide">
            Days Inn® Wildwood Physical Layout & Aerial Blueprint
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
            {both ? "Floors 1 & 2 (Stacked: 1xx / 2xx)" : `Floor ${floor}`}
          </span>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Clean
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Dirty
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-400" /> Occupied
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-400" /> DND
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Out of order
          </span>
        </div>
      </div>

      {/* BLUEPRINT CONTAINER */}
      <div className="min-w-[960px] space-y-3">
        {/* TOP PERIMETER: TRUCK PARKING (FL-44 HIGHWAY FRONTAGE) */}
        <div className="grid grid-cols-[1.5fr_2fr_1.5fr] gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-center text-[10px] font-bold text-amber-300">
          <div className="text-left text-slate-400">Even Number Rooms (Outer / North)</div>
          <div className="flex items-center justify-center gap-1 uppercase tracking-widest">
            <Truck className="h-3.5 w-3.5" /> Truck Parking (FL-44 Frontage)
          </div>
          <div className="text-right text-slate-400">Odd Number Rooms (Courtyard)</div>
        </div>

        {/* TOP ROW: L-CORNER BLOCK (LEFT) + NORTH HORIZONTAL WING (RIGHT) */}
        <div className="grid grid-cols-[260px_1fr] gap-3 items-stretch">
          {/* TOP-LEFT CORNER BLOCK: LOBBY, SERVICES & ROOM 108/208 */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1 text-rose-400">
                <MapPin className="h-3 w-3" /> Lobby & Admin Corner
              </span>
              <span className="text-[9px] text-slate-500">Corner Wing</span>
            </div>

            <div className="flex gap-2">
              {/* ICE Machine column on outer left */}
              <div className="w-8 shrink-0 flex flex-col items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10 p-1 text-[9px] font-bold text-cyan-300">
                <Snowflake className="h-3.5 w-3.5 mb-1" />
                <span className="[writing-mode:vertical-rl] tracking-widest uppercase">ICE</span>
              </div>

              {/* Main Admin Grid */}
              <div className="flex-1 space-y-1">
                {/* Breezeway / Stairs */}
                <div className="rounded border border-dashed border-amber-500/30 bg-amber-500/10 py-0.5 text-center text-[9px] font-bold tracking-widest text-amber-300 uppercase">
                  BREEZEWAY // STAIRS
                </div>

                {/* GM Office | Kitchen */}
                <div className="grid grid-cols-2 gap-1">
                  <Space label="GM OFFICE" className="py-1 text-[9px]" />
                  <Space label="Kitchen" className="py-1 text-[9px]" />
                </div>

                {/* Lobby / Registration / Breakfast */}
                <div className="rounded border border-white/20 bg-slate-800/80 p-1.5 text-center text-[9px] font-bold text-white shadow-inner">
                  Lobby / Registration / Breakfast
                </div>

                {/* Security | Room 108 / 208 */}
                <div className="grid grid-cols-2 gap-1 items-center">
                  <Space label="SECURITY" className="py-1 text-[9px]" />
                  <StackedPair floor1Num="108" floor2Num="208" size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* NORTH HORIZONTAL WING: ROOMS 136-162 (TOP) & 137-163/265 (BOTTOM) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 flex flex-col justify-between">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                North Building (Rooms 136–162 / 236–262 Outer · 137–163 / 237–265 Courtyard)
              </span>
              <div className="flex gap-2 text-[9px] font-semibold text-slate-400">
                <span className="rounded bg-white/10 px-1.5 py-0.5">Top: Even (Outer)</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5">Bottom: Odd (Pool View)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                {/* Top Row: Outer / Even Rooms */}
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${north.top.length}, minmax(0, 1fr))` }}
                >
                  {north.top.map((num, i) => (
                    <StackedPair
                      key={num}
                      floor1Num={num}
                      floor2Num={northF2.top[i] ?? lift(Number(num), 2)}
                      size="sm"
                    />
                  ))}
                </div>

                {/* Central Corridor */}
                <div className="h-2 rounded bg-slate-950/80 text-center text-[7px] font-mono text-slate-500 leading-none flex items-center justify-center">
                  CORRIDOR // BREEZEWAY
                </div>

                {/* Bottom Row: Inner / Odd Rooms */}
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${north.bottom.length}, minmax(0, 1fr))` }}
                >
                  {north.bottom.map((num, i) => (
                    <StackedPair
                      key={num}
                      floor1Num={num}
                      floor2Num={northF2.bottom[i] ?? lift(Number(num), 2)}
                      size="sm"
                    />
                  ))}
                </div>
              </div>

              {/* Far-Right Stairs */}
              <div className="grid w-7 shrink-0 place-items-center rounded border border-amber-500/30 bg-amber-500/10 text-[9px] font-black tracking-widest text-amber-300 uppercase [writing-mode:vertical-rl]">
                STAIRS
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: WEST WING (LEFT) + COURTYARD & POOL (CENTER) + EAST PARKING (RIGHT) */}
        <div className="grid grid-cols-[260px_1fr_120px] gap-3 items-stretch">
          {/* WEST WING (VERTICAL BUILDING) */}
          <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>WEST WING</span>
              <span className="text-[9px] text-slate-500">Outer (Odds) | Inner (Evens)</span>
            </div>

            <div className="space-y-1">
              {wing.map((row, i) =>
                row.kind === "divider" ? (
                  <div
                    key={`div-${i}`}
                    className="rounded border border-dashed border-amber-500/30 bg-amber-500/10 py-1 text-center text-[9px] font-black tracking-widest text-amber-300 uppercase"
                  >
                    {row.label}
                  </div>
                ) : (
                  <div key={row.outer} className="grid grid-cols-2 gap-1">
                    <StackedPair
                      floor1Num={row.outer}
                      floor2Num={lift(Number(row.outer), 2)}
                      size="sm"
                    />
                    <StackedPair
                      floor1Num={row.inner}
                      floor2Num={lift(Number(row.inner), 2)}
                      size="sm"
                    />
                  </div>
                ),
              )}

              {/* Service & Storage at Bottom of West Wing */}
              <div className="mt-2 space-y-1 border-t border-white/10 pt-1.5">
                <div className="grid grid-cols-2 gap-1">
                  <Space label="Facility" className="py-1 text-[9px]" />
                  <Space label="Vending" className="py-1 text-[9px]" />
                </div>
                <Space label="Laundry and Storage" className="py-1.5 text-[9px]" />
              </div>
            </div>
          </div>

          {/* COURTYARD: SWIM POOL & CENTRAL GUEST PARKING */}
          <div className="flex flex-col justify-between space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            {/* SWIM POOL */}
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-blue-900/50 via-cyan-900/30 to-slate-950 p-6 text-center shadow-xl">
              <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
                <Waves className="h-4 w-4" /> Central Courtyard
              </div>
              <div className="my-4 flex flex-col items-center justify-center">
                <div className="rounded-xl border border-cyan-400/60 bg-cyan-500/25 px-10 py-6 backdrop-blur-md shadow-lg shadow-cyan-500/20">
                  <h3 className="font-serif text-xl font-bold text-cyan-100 tracking-wider">
                    SWIM POOL
                  </h3>
                  <p className="mt-1 text-[11px] text-cyan-200/90 font-medium">
                    Outdoor Heated Pool & Sun Deck
                  </p>
                </div>
              </div>
            </div>

            {/* CENTRAL GUEST PARKING */}
            <div className="flex-1 flex flex-col justify-center items-center rounded-xl border border-dashed border-white/15 bg-slate-950/60 p-6 text-center">
              <Car className="h-6 w-6 text-slate-400 mb-1 opacity-70" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Main Courtyard Guest Parking
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Stalls facing West Wing & Pool Walkways
              </span>
            </div>
          </div>

          {/* RIGHT MARGIN: EAST PARKING & DRIVEWAY */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-900/60 p-3 text-center">
            <Car className="h-5 w-5 text-slate-400 mb-2 opacity-70" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase [writing-mode:vertical-rl]">
              GUEST PARKING & ACCESS DRIVEWAY
            </span>
          </div>
        </div>

        {/* BOTTOM PERIMETER: SOUTH TRUCK PARKING */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-center text-[10px] font-bold text-amber-300 flex items-center justify-center gap-2">
          <Truck className="h-4 w-4" />
          <span className="uppercase tracking-widest">
            Truck Parking & Rear Perimeter Driveway
          </span>
        </div>
      </div>
    </div>
  );
}

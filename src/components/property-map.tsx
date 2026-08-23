import { useMemo } from "react";
import {
  frontBlock,
  rearBuilding,
  westWing,
  SERVICE_SPACES,
  type FloorKey,
} from "@/lib/property-layout";

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

const TILE: Record<RoomStatus, string> = {
  vacant_clean: "border-status-clean/55 bg-status-clean/14 hover:bg-status-clean/25",
  vacant_dirty: "border-status-dirty/55 bg-status-dirty/14 hover:bg-status-dirty/25",
  occupied: "border-status-occupied/55 bg-status-occupied/16 hover:bg-status-occupied/26",
  occupied_dnd: "border-status-dnd/55 bg-status-dnd/16 hover:bg-status-dnd/26",
  reserved: "border-status-reserved/55 bg-status-reserved/14 hover:bg-status-reserved/25",
  out_of_order: "border-status-ooo/55 bg-status-ooo/14 hover:bg-status-ooo/25",
};

type Props = {
  floor: FloorKey;
  rooms: MapRoom[];
  openRequests?: Map<string, number>;
  dimmed?: Set<string>;
  onSelect: (roomId: string) => void;
};

export function PropertyMap({ floor, rooms, openRequests, dimmed, onSelect }: Props) {
  const byNumber = useMemo(() => {
    const map = new Map<string, MapRoom>();
    for (const room of rooms) map.set(room.number, room);
    return map;
  }, [rooms]);

  const wing = westWing(floor);
  const rear = rearBuilding(floor);
  const front = frontBlock(floor);

  function Tile({ number, size = "md" }: { number: string; size?: "md" | "sm" }) {
    const room = byNumber.get(number);
    if (!room) {
      return (
        <div className="border border-cream/10 bg-cream/[0.02] px-2 py-2 text-center text-[11px] text-cream/25">
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
        title={`${number} · ${room.guest_name ?? "vacant"}`}
        className={`relative border text-center transition-colors duration-200 ${TILE[room.status]} ${
          size === "sm" ? "px-1 py-2" : "px-2 py-2.5"
        } ${faded ? "opacity-25" : ""}`}
      >
        <span className={size === "sm" ? "text-xs" : "text-sm"}>{number}</span>
        {open ? (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-amber text-[10px] font-bold text-ink"
          >
            {open}
          </span>
        ) : null}
      </button>
    );
  }

  const Space = ({ label, className = "" }: { label: string; className?: string }) => (
    <div
      className={`grid place-items-center border border-cream/15 bg-cream/[0.04] px-2 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-cream/45 ${className}`}
    >
      {label}
    </div>
  );

  const Edge = ({ label, className = "" }: { label: string; className?: string }) => (
    <p
      className={`signage text-center text-[10px] text-cream/25 ${className}`}
    >
      {label}
    </p>
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px] space-y-2">
        <Edge label="Truck parking · FL-44" />

        {/* Front block: lobby / offices downstairs, 200-series upstairs */}
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] gap-2">
          <div className="space-y-1">
            <Edge label={floor === 1 ? "Lobby building" : "Upstairs · front"} />
            <div className="grid grid-cols-2 gap-1">
              {front.west.map((cell, i) =>
                cell.kind === "room" ? (
                  <Tile key={cell.number} number={cell.number} size="sm" />
                ) : (
                  <Space
                    key={`${cell.label}-${i}`}
                    label={cell.label}
                    className={cell.wide ? "col-span-2" : ""}
                  />
                ),
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Edge label={floor === 1 ? "Courtyard" : "Upstairs · east"} />
            <div className="grid grid-cols-3 gap-1">
              {front.east.map((cell, i) =>
                cell.kind === "room" ? (
                  <Tile key={cell.number} number={cell.number} size="sm" />
                ) : (
                  <Space
                    key={`${cell.label}-${i}`}
                    label={cell.label}
                    className="col-span-3 py-10"
                  />
                ),
              )}
              {floor === 2 ? <Space label="Swim pool below" className="col-span-3 py-8" /> : null}
            </div>
          </div>
        </div>

        {/* West wing + rear building */}
        <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,2.3fr)] gap-2">
          <div className="space-y-1">
            <Edge label="West wing" />
            <div className="space-y-1">
              {wing.map((row, i) =>
                row.kind === "divider" ? (
                  <div
                    key={`div-${i}`}
                    className="border border-dashed border-cream/20 px-2 py-1 text-center text-[10px] uppercase tracking-[0.18em] text-cream/35"
                  >
                    {row.label}
                  </div>
                ) : (
                  <div key={row.left} className="grid grid-cols-2 gap-1">
                    <Tile number={row.left} size="sm" />
                    <Tile number={row.right} size="sm" />
                  </div>
                ),
              )}
              <div className="grid grid-cols-2 gap-1">
                {SERVICE_SPACES.map((label) => (
                  <Space
                    key={label}
                    label={label}
                    className={label === "Laundry & storage" ? "col-span-2" : ""}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Edge label="Parking" />
            <div className="space-y-1 border border-cream/10 p-2">
              <div className="flex justify-end">
                <span className="border border-cream/20 px-3 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cream/40">
                  Stairs
                </span>
              </div>
              <div className="flex gap-1">
                <span className="grid w-6 shrink-0 place-items-center border border-cream/20 text-[9px] uppercase tracking-[0.2em] text-cream/35 [writing-mode:vertical-rl]">
                  Stair
                </span>
                <div className="grid flex-1 gap-1">
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${rear.front.length}, minmax(0,1fr))` }}
                  >
                    {rear.front.map((n) => (
                      <Tile key={n} number={n} size="sm" />
                    ))}
                  </div>
                  <div className="h-3 border-y border-dashed border-cream/15" />
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${rear.back.length}, minmax(0,1fr))` }}
                  >
                    {rear.back.map((n) => (
                      <Tile key={n} number={n} size="sm" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <span className="border border-cream/20 px-3 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cream/40">
                  Stairs
                </span>
              </div>
            </div>
            <Edge label="Parking" />
          </div>
        </div>

        <Edge label="Truck parking" />
      </div>
    </div>
  );
}

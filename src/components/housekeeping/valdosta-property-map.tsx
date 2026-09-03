import { useMemo, useState } from "react";
import { MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import type { RoomRow } from "@/components/housekeeping/types";

type Props = {
  rooms: RoomRow[];
  onSelect: (room: RoomRow) => void;
};

type RoomStatus = RoomRow["status"];

const ROOM_FILL: Record<RoomStatus, string> = {
  vacant_clean: "#13805b",
  vacant_dirty: "#f5b942",
  occupied: "#1976b9",
  occupied_dnd: "#7c3aed",
  reserved: "#d9a719",
  out_of_order: "#dc3b45",
};

const LEGEND: Array<{ status: RoomStatus; label: string }> = [
  { status: "vacant_clean", label: "Ready" },
  { status: "vacant_dirty", label: "Needs cleaning" },
  { status: "occupied", label: "Occupied" },
  { status: "occupied_dnd", label: "DND" },
  { status: "out_of_order", label: "Out of order" },
];

const TOP_ROOMS = Array.from({ length: 30 }, (_, index) => String(130 - index));
const WEST_ROOMS = Array.from({ length: 11 }, (_, index) => String(132 + index));
const VALDOSTA_ROOMS = new Set(["131", ...TOP_ROOMS, ...WEST_ROOMS]);

function roomFill(room: RoomRow | undefined) {
  if (!room) return "#d8dee8";
  if (room.hk_stage === "in_progress") return "#0e93a7";
  if (room.dnd) return ROOM_FILL.occupied_dnd;
  return ROOM_FILL[room.status] ?? "#64748b";
}

function textFill(room: RoomRow | undefined) {
  const fill = roomFill(room);
  return fill === "#f5b942" || fill === "#d9a719" || fill === "#d8dee8" ? "#172033" : "#ffffff";
}

export function ValdostaPropertyMap({ rooms, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const byNumber = useMemo(
    () =>
      new Map(
        rooms.filter((room) => VALDOSTA_ROOMS.has(room.number)).map((room) => [room.number, room]),
      ),
    [rooms],
  );
  const normalizedQuery = query.trim();

  function roomOpacity(number: string) {
    return !normalizedQuery || number.includes(normalizedQuery) ? 1 : 0.26;
  }

  function selectRoom(number: string) {
    const room = byNumber.get(number);
    if (room) onSelect(room);
  }

  function RoomCell({
    number,
    x,
    y,
    width = 36,
    height = 58,
  }: {
    number: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
  }) {
    const room = byNumber.get(number);
    return (
      <g
        role={room ? "button" : undefined}
        tabIndex={room ? 0 : undefined}
        aria-label={room ? `Open room ${number}` : `Room ${number}, not in current room list`}
        onClick={() => selectRoom(number)}
        onKeyDown={(event) => {
          if (room && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSelect(room);
          }
        }}
        className={room ? "cursor-pointer outline-none" : undefined}
        opacity={roomOpacity(number)}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx="5"
          fill={roomFill(room)}
          stroke="#ffffff"
          strokeWidth="2"
          className={room ? "transition-[filter] hover:brightness-110" : undefined}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 + 5}
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill={textFill(room)}
        >
          {number}
        </text>
        {room?.hk_stage === "in_progress" ? (
          <circle cx={x + width - 7} cy={y + 8} r="4" fill="#ffffff" />
        ) : null}
      </g>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-[#062e51] px-4 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f7c844]">
              Days Inn · Valdosta
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
              Live property map
            </h2>
            <p className="mt-1 text-sm text-white/70">
              1827 West Hill Avenue · Tap a room to update it
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            Live room status
          </span>
        </div>

        <label className="mt-4 flex max-w-sm items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 focus-within:border-[#f7c844]">
          <Search className="h-4 w-4 text-white/60" />
          <span className="sr-only">Find a room</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="Find room number"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/45"
          />
        </label>
      </header>

      <div className="overflow-x-auto bg-[#e9eef4] p-3 sm:p-5">
        <svg
          viewBox="0 0 1400 740"
          role="img"
          aria-label="Digital property map of Days Inn Valdosta showing rooms 101 through 142, parking, lobby, registration, pool, stairs, ice and vending"
          className="min-w-[880px] rounded-2xl bg-[#dbe3eb] shadow-inner"
        >
          <defs>
            <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#536273" />
              <stop offset="1" stopColor="#374657" />
            </linearGradient>
            <pattern id="grass" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#a9c78e" />
              <circle cx="3" cy="5" r="1" fill="#91b377" opacity=".6" />
            </pattern>
          </defs>

          <rect x="20" y="20" width="1360" height="700" rx="24" fill="url(#grass)" />
          <rect x="145" y="130" width="1130" height="520" rx="18" fill="url(#asphalt)" />

          {/* North guest-room wing */}
          <rect
            x="86"
            y="54"
            width="1090"
            height="86"
            rx="12"
            fill="#f8fafc"
            stroke="#90a0b3"
            strokeWidth="3"
          />
          <RoomCell number="131" x={100} y={68} width={62} />
          {TOP_ROOMS.map((number, index) => (
            <RoomCell key={number} number={number} x={168 + index * 33} y={68} width={31} />
          ))}

          {/* West guest-room wing */}
          <rect
            x="54"
            y="146"
            width="92"
            height="526"
            rx="12"
            fill="#f8fafc"
            stroke="#90a0b3"
            strokeWidth="3"
          />
          {WEST_ROOMS.map((number, index) => (
            <RoomCell
              key={number}
              number={number}
              x={70}
              y={158 + index * 44}
              width={60}
              height={40}
            />
          ))}

          {/* Parking runs */}
          {[245, 455, 665, 875].map((x) => (
            <g key={x}>
              <rect
                x={x}
                y="255"
                width="116"
                height="292"
                rx="8"
                fill="#455464"
                stroke="#aeb9c5"
                strokeWidth="2"
              />
              {Array.from({ length: 9 }, (_, index) => (
                <line
                  key={index}
                  x1={x}
                  y1={278 + index * 30}
                  x2={x + 116}
                  y2={278 + index * 30}
                  stroke="#d8e0e8"
                  strokeWidth="2"
                />
              ))}
              <text
                x={x + 58}
                y="410"
                textAnchor="middle"
                fill="#dce5ed"
                fontSize="16"
                fontWeight="700"
                letterSpacing="3"
                transform={`rotate(-90 ${x + 58} 410)`}
              >
                PARKING
              </text>
            </g>
          ))}

          {/* Site landmarks */}
          <g>
            <rect
              x="1130"
              y="164"
              width="142"
              height="166"
              rx="12"
              fill="#f8fafc"
              stroke="#90a0b3"
              strokeWidth="3"
            />
            <rect x="1145" y="175" width="112" height="48" rx="7" fill="#e6edf5" />
            <text
              x="1201"
              y="204"
              textAnchor="middle"
              fontSize="15"
              fontWeight="800"
              fill="#26384c"
            >
              ICE &amp; VENDING
            </text>
            <rect x="1145" y="234" width="112" height="82" rx="7" fill="#fff" />
            <text
              x="1201"
              y="282"
              textAnchor="middle"
              fontSize="18"
              fontWeight="900"
              fill="#062e51"
            >
              LOBBY
            </text>
          </g>

          <g>
            <rect
              x="1148"
              y="348"
              width="108"
              height="60"
              rx="9"
              fill="#f8fafc"
              stroke="#90a0b3"
              strokeWidth="3"
            />
            <text
              x="1202"
              y="384"
              textAnchor="middle"
              fontSize="13"
              fontWeight="800"
              fill="#26384c"
            >
              REGISTRATION
            </text>
          </g>

          <g>
            <rect
              x="1080"
              y="468"
              width="198"
              height="166"
              rx="18"
              fill="#c9d6be"
              stroke="#6f8c68"
              strokeWidth="3"
            />
            <rect
              x="1122"
              y="493"
              width="114"
              height="116"
              rx="20"
              fill="#3cb4da"
              stroke="#eefcff"
              strokeWidth="4"
            />
            <path
              d="M1135 520q22-16 44 0t44 0M1135 551q22-16 44 0t44 0M1135 582q22-16 44 0t44 0"
              fill="none"
              stroke="#b9efff"
              strokeWidth="4"
            />
            <text
              x="1179"
              y="558"
              textAnchor="middle"
              fontSize="18"
              fontWeight="900"
              fill="#063f61"
            >
              POOL
            </text>
          </g>

          <g fill="#f8fafc" stroke="#90a0b3" strokeWidth="2">
            <rect x="88" y="208" width="44" height="56" rx="5" />
            <rect x="88" y="572" width="44" height="56" rx="5" />
            <rect x="712" y="145" width="54" height="54" rx="5" />
            <rect x="1269" y="81" width="54" height="54" rx="5" />
          </g>
          <g fill="#33475b" fontSize="10" fontWeight="800" textAnchor="middle">
            <text x="110" y="239">
              STAIRS
            </text>
            <text x="110" y="603">
              STAIRS
            </text>
            <text x="739" y="176">
              STAIRS
            </text>
            <text x="1296" y="112">
              STAIRS
            </text>
          </g>

          <g>
            <circle cx="507" cy="198" r="10" fill="#f7c844" stroke="#fff" strokeWidth="3" />
            <MapPin x="490" y="181" width="34" height="34" color="#062e51" fill="#f7c844" />
            <text x="536" y="204" fontSize="17" fontWeight="900" fill="#ffffff">
              YOU ARE HERE · ROOM 128
            </text>
          </g>

          <g fill="#d8e0e8" fontSize="18" fontWeight="800" letterSpacing="6" opacity=".9">
            <text x="340" y="224">
              GUEST PARKING
            </text>
            <text x="760" y="224">
              GUEST PARKING
            </text>
          </g>
          <g transform="translate(1314 650)">
            <circle r="32" fill="#062e51" stroke="#fff" strokeWidth="3" />
            <path d="M0-20 10 10 0 4-10 10Z" fill="#f7c844" />
            <text x="0" y="50" textAnchor="middle" fontSize="14" fontWeight="900" fill="#062e51">
              N
            </text>
          </g>
        </svg>
      </div>

      {otherRooms.length > 0 ? (
        <div className="border-t border-slate-200 px-4 py-4 sm:px-6">
          <p className="text-[11px] font-bold tracking-[0.18em] text-slate-500 uppercase">
            Other rooms
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Rooms outside the illustrated wings — tap to open.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {otherRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelect(room)}
                aria-label={`Open room ${room.number}`}
                className="rounded-lg px-2 py-2 text-sm font-bold shadow-sm transition hover:brightness-110"
                style={{
                  backgroundColor: roomFill(room),
                  color: textFill(room),
                  opacity: roomOpacity(room.number),
                }}
              >
                {room.number}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <footer className="space-y-3 border-t border-slate-200 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Room status legend">
          {LEGEND.map((item) => (
            <span
              key={item.status}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ROOM_FILL[item.status] }}
              />
              {item.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0e93a7]" /> Cleaning now
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Status colors update with the board
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Fire and stair locations retained from the
            posted plan
          </span>
        </div>
      </footer>
    </section>
  );
}

import React, { useState } from "react";
import { Bed, ArrowUp, Sparkles, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

import { STATUS_COLORS, type PropertyRoomData, type RoomStatusType } from "./property-aerial-types";

export type { PropertyRoomData, RoomStatusType };

interface PropertyAerialMapProps {
  rooms: Record<string, PropertyRoomData>;
  selectedFilter: string;
  selectedRoom: string | null;
  onSelectRoom: (roomNumber: string) => void;
}

export function PropertyAerialMap({
  rooms,
  selectedFilter,
  selectedRoom,
  onSelectRoom,
}: PropertyAerialMapProps) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Helper to determine if room matches the active filter
  const isMatch = (status: RoomStatusType) => {
    if (!selectedFilter || selectedFilter === "All") return true;
    return status.toLowerCase() === selectedFilter.toLowerCase();
  };

  // Vertical wing rooms (from top to bottom)
  const verticalRooms = [
    "201",
    "201b",
    "203",
    "205",
    "207",
    "209",
    "211",
    "213",
    "215",
    "217",
    "219",
    "221",
    "223",
    "225",
    "227",
    "229",
    "231",
    "233",
    "235",
  ];

  // Horizontal wing rooms (from left to right)
  const horizontalRooms = ["236", "238", "240", "242", "244", "246", "248", "250", "252", "254"];

  return (
    <div className="relative w-full h-full min-h-[560px] bg-[#f8fafc] rounded-2xl border border-slate-200/80 p-3 shadow-inner overflow-hidden flex flex-col justify-center items-center select-none">
      <svg
        viewBox="0 0 1000 700"
        className="w-full h-full max-h-[720px] object-contain drop-shadow-sm"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="grassBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d2e3c8" />
            <stop offset="100%" stopColor="#c3dcba" />
          </linearGradient>
          <linearGradient id="poolWater" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="roofTone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="roofDark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7ba3c6" />
            <stop offset="100%" stopColor="#5c82a4" />
          </linearGradient>
          <filter id="mapShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
          <filter id="treeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#064e3b" floodOpacity="0.25" />
          </filter>
          <filter id="carShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Base Landscape & Roads */}
        <rect x="0" y="0" width="1000" height="700" fill="url(#grassBg)" rx="16" />

        {/* Diagonal road "Hospitality Dr" on top left */}
        <path
          d="M 20 220 L 260 20 L 350 20 L 290 280 L 270 630 L 220 630 L 240 280 Z"
          fill="#cbd5e1"
        />
        {/* Hospitality Dr road lines */}
        <path d="M 50 200 L 270 20" stroke="#ffffff" strokeWidth="3" strokeDasharray="12 8" />
        <text
          x="275"
          y="105"
          fill="#475569"
          fontSize="11"
          fontWeight="600"
          letterSpacing="1"
          transform="rotate(-42 275 105)"
        >
          Hospitality Dr
        </text>

        {/* Green landscape verge along hospitality dr */}
        <path d="M 260 220 Q 280 400 280 630 L 310 630 Q 310 400 290 220 Z" fill="#a7cd96" />

        {/* 2. Top Road "PUBLIC ROAD" */}
        <rect x="330" y="15" width="460" height="42" fill="#e2e8f0" rx="4" />
        <text x="510" y="38" fill="#475569" fontSize="11" fontWeight="700" letterSpacing="1.5">
          PUBLIC ROAD
        </text>
        {/* Public Road arrows */}
        <path
          d="M 525 80 L 525 110 M 521 100 L 525 110 L 529 100"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 525 140 L 525 170 M 521 160 L 525 170 L 529 160"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 530 200 L 512 200 M 520 196 L 512 200 L 520 204"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Right side driveway exit curve with traffic arrow */}
        <path
          d="M 740 350 C 740 375 720 375 696 375"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 740 350 L 736 360 M 740 350 L 744 360"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M 696 490 C 725 490 732 505 732 525"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 732 525 L 728 515 M 732 525 L 736 515"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 3. Central Parking Lot */}
        <rect
          x="440"
          y="65"
          width="310"
          height="520"
          fill="#f1f5f9"
          stroke="#e2e8f0"
          strokeWidth="2"
          rx="10"
        />

        {/* Inner corridor asphalt next to building */}
        <rect x="435" y="165" width="55" height="420" fill="#64748b" rx="4" />

        {/* Parking Stalls Striping - Left Column */}
        {Array.from({ length: 14 }).map((_, i) => (
          <g key={`stall-l-${i}`}>
            <line
              x1="455"
              y1={175 + i * 26}
              x2="488"
              y2={175 + i * 26}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />
          </g>
        ))}

        {/* Parking Stalls Striping - Center Islands */}
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={`stall-c-${i}`}>
            <line
              x1="535"
              y1={235 + i * 28}
              x2="575"
              y2={235 + i * 28}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <line
              x1="625"
              y1={235 + i * 28}
              x2="665"
              y2={235 + i * 28}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          </g>
        ))}

        {/* Blue Handicap Parking Stalls under pool */}
        <rect x="580" y="222" width="22" height="18" fill="#3b82f6" rx="3" opacity="0.9" />
        <circle cx="591" cy="227" r="2.5" fill="#ffffff" />
        <path
          d="M 589 231 L 593 231 M 591 230 L 591 236 L 594 238"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        <rect x="640" y="222" width="22" height="18" fill="#3b82f6" rx="3" opacity="0.9" />
        <circle cx="651" cy="227" r="2.5" fill="#ffffff" />
        <path
          d="M 649 231 L 653 231 M 651 230 L 651 236 L 654 238"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Parked Cars on Parking Stalls */}
        {/* Car 1: Dark Navy Sedan */}
        <g filter="url(#carShadow)">
          <rect x="460" y="185" width="22" height="13" rx="4" fill="#1e293b" />
          <rect x="464" y="187" width="14" height="9" rx="2" fill="#334155" />
          <rect x="466" y="188" width="10" height="7" rx="1.5" fill="#0f172a" />
        </g>
        {/* Car 2: Black SUV */}
        <g filter="url(#carShadow)">
          <rect x="460" y="215" width="24" height="14" rx="4" fill="#0f172a" />
          <rect x="465" y="217" width="14" height="10" rx="2" fill="#1e293b" />
        </g>
        {/* Car 3: Grey Sedan */}
        <g filter="url(#carShadow)">
          <rect x="460" y="295" width="22" height="13" rx="4" fill="#334155" />
          <rect x="464" y="297" width="14" height="9" rx="2" fill="#475569" />
        </g>
        {/* Car 4: Silver Sedan */}
        <g filter="url(#carShadow)">
          <rect x="460" y="380" width="22" height="13" rx="4" fill="#94a3b8" />
          <rect x="464" y="382" width="14" height="9" rx="2" fill="#cbd5e1" />
        </g>
        {/* Car 5: Navy Blue SUV in Center */}
        <g filter="url(#carShadow)">
          <rect x="533" y="260" width="13" height="22" rx="3" fill="#1e3a5f" />
          <rect x="535" y="264" width="9" height="14" rx="2" fill="#3b82f6" opacity="0.6" />
        </g>
        {/* Car 6: Red/Burgundy Sedan */}
        <g filter="url(#carShadow)">
          <rect x="590" y="475" width="12" height="22" rx="3" fill="#881337" />
          <rect x="592" y="479" width="8" height="14" rx="2" fill="#be123c" />
        </g>
        {/* Car 7: White/Silver Sedan */}
        <g filter="url(#carShadow)">
          <rect
            x="610"
            y="260"
            width="13"
            height="22"
            rx="3"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="0.5"
          />
        </g>
        {/* Car 8: Black Sedan */}
        <g filter="url(#carShadow)">
          <rect x="645" y="325" width="13" height="22" rx="3" fill="#1e293b" />
        </g>
        {/* Car 9: Dark Grey SUV */}
        <g filter="url(#carShadow)">
          <rect x="645" y="360" width="14" height="24" rx="3" fill="#334155" />
        </g>

        {/* 4. Swimming Pool Enclosure (Top-Right) */}
        <g filter="url(#mapShadow)">
          {/* Deck Pavers */}
          <rect
            x="560"
            y="130"
            width="160"
            height="95"
            rx="8"
            fill="#fde68a"
            stroke="#d97706"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Pool Basin */}
          <rect
            x="615"
            y="152"
            width="65"
            height="42"
            rx="14"
            fill="url(#poolWater)"
            stroke="#0284c7"
            strokeWidth="2"
          />
          <text
            x="647"
            y="177"
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="800"
            textAnchor="middle"
            letterSpacing="0.5"
            opacity="0.95"
          >
            SWIM POOL
          </text>

          {/* Sun Umbrellas (Blue & White) */}
          <circle cx="595" cy="148" r="7" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
          <circle cx="595" cy="148" r="2.5" fill="#ffffff" />
          <circle cx="700" cy="148" r="7" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
          <circle cx="700" cy="148" r="2.5" fill="#ffffff" />

          <circle cx="595" cy="208" r="7" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
          <circle cx="595" cy="208" r="2.5" fill="#ffffff" />
          <circle cx="700" cy="208" r="7" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
          <circle cx="700" cy="208" r="2.5" fill="#ffffff" />

          {/* Lounge Chairs */}
          <rect
            x="612"
            y="200"
            width="10"
            height="6"
            rx="1.5"
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          <rect
            x="626"
            y="200"
            width="10"
            height="6"
            rx="1.5"
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          <rect
            x="668"
            y="200"
            width="10"
            height="6"
            rx="1.5"
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          <rect
            x="682"
            y="200"
            width="10"
            height="6"
            rx="1.5"
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />

          {/* Pool Cabana / Restroom Structure */}
          <rect
            x="630"
            y="196"
            width="36"
            height="18"
            fill="url(#roofTone)"
            stroke="#3b82f6"
            strokeWidth="1"
            rx="2"
          />
        </g>

        {/* 5. Lush Landscaping & Island Trees */}
        {/* Corner vegetation and islands */}
        <g filter="url(#treeShadow)">
          {/* Trees top right */}
          <circle cx="720" cy="95" r="14" fill="#365314" />
          <circle cx="718" cy="92" r="12" fill="#4d7c0f" />
          <circle cx="716" cy="89" r="8" fill="#65a30d" />

          {/* Central island trees in parking lot */}
          <circle cx="518" cy="245" r="13" fill="#14532d" />
          <circle cx="516" cy="242" r="11" fill="#15803d" />
          <circle cx="514" cy="239" r="7" fill="#22c55e" />

          <circle cx="518" cy="390" r="13" fill="#14532d" />
          <circle cx="516" cy="387" r="11" fill="#15803d" />
          <circle cx="514" cy="384" r="7" fill="#22c55e" />

          <circle cx="518" cy="535" r="13" fill="#14532d" />
          <circle cx="516" cy="532" r="11" fill="#15803d" />
          <circle cx="514" cy="529" r="7" fill="#22c55e" />

          {/* Center right trees */}
          <circle cx="680" cy="360" r="13" fill="#14532d" />
          <circle cx="678" cy="357" r="11" fill="#15803d" />
          <circle cx="676" cy="354" r="7" fill="#22c55e" />

          <circle cx="602" cy="425" r="16" fill="#14532d" />
          <circle cx="600" cy="422" r="14" fill="#15803d" />
          <circle cx="597" cy="419" r="9" fill="#22c55e" />

          <circle cx="680" cy="450" r="12" fill="#14532d" />
          <circle cx="678" cy="448" r="10" fill="#15803d" />

          <circle cx="615" cy="535" r="13" fill="#14532d" />
          <circle cx="613" cy="532" r="11" fill="#15803d" />

          <circle cx="718" cy="550" r="12" fill="#14532d" />
          <circle cx="716" cy="548" r="10" fill="#15803d" />

          {/* Left driveway trees row */}
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={`tree-left-${i}`}>
              <circle cx="355" cy={230 + i * 50} r="14" fill="#14532d" />
              <circle cx="353" cy={228 + i * 50} r="12" fill="#15803d" />
              <circle cx="351" cy={225 + i * 50} r="7" fill="#4ade80" />
            </g>
          ))}

          {/* Bottom perimeter trees row */}
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={`tree-bottom-${i}`}>
              <circle cx={250 + i * 45} cy="660" r="15" fill="#14532d" />
              <circle cx={248 + i * 45} cy={658} r="13" fill="#15803d" />
              <circle cx={246 + i * 45} cy={655} r="8" fill="#4ade80" />
            </g>
          ))}
        </g>

        {/* 6. Main Building Geometry (L-Shape Hotel) */}
        <g filter="url(#mapShadow)">
          {/* Building Base Shadow / Outline */}
          <path
            d="M 370 190 L 495 190 L 495 240 L 450 240 L 450 540 L 695 540 L 695 625 L 370 625 Z"
            fill="#475569"
            opacity="0.2"
          />

          {/* Top Front Canopy / Lobby Entry Structure with Hip Roof */}
          <path
            d="M 372 188 L 415 170 L 448 188 L 448 238 L 372 238 Z"
            fill="url(#roofTone)"
            stroke="#1d4ed8"
            strokeWidth="1.5"
          />
          {/* Hip Roof Ridges */}
          <path
            d="M 415 170 L 415 210 M 372 188 L 415 210 M 448 188 L 415 210 M 372 238 L 415 210 M 448 238 L 415 210"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
          {/* Extended front porch roof */}
          <path
            d="M 448 195 L 495 195 L 495 240 L 448 240 Z"
            fill="url(#roofTone)"
            stroke="#1d4ed8"
            strokeWidth="1"
          />

          {/* Corner Turret / Pavilion (Bottom Left) */}
          <rect
            x="372"
            y="550"
            width="55"
            height="55"
            fill="url(#roofTone)"
            stroke="#1d4ed8"
            strokeWidth="1.5"
            rx="3"
          />
          <path
            d="M 372 550 L 427 605 M 427 550 L 372 605"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeOpacity="0.8"
          />

          {/* East End Pavilion (Bottom Right) */}
          <rect
            x="660"
            y="550"
            width="34"
            height="55"
            fill="url(#roofTone)"
            stroke="#1d4ed8"
            strokeWidth="1.5"
            rx="2"
          />
          <path
            d="M 660 550 L 694 605 M 694 550 L 660 605"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeOpacity="0.8"
          />

          {/* ======================================================== */}
          {/* VERTICAL WING ROOM CELLS (201 - 235) */}
          {/* ======================================================== */}
          <g>
            {verticalRooms.map((roomKey, idx) => {
              const roomNumber = roomKey === "201b" ? "201" : roomKey;
              const roomData = rooms[roomNumber] || {
                number: roomNumber,
                status: "Clean",
                floor: "2nd",
                type: "2 Queen Beds",
              };
              const status = roomData.status;
              const colors = STATUS_COLORS[status] || STATUS_COLORS.Clean;
              const matching = isMatch(status);
              const isSelected = selectedRoom === roomNumber;
              const isHovered = hoveredRoom === roomNumber;

              const y = 222 + idx * 16.8;
              const x = 382;
              const w = 45;
              const h = 16.8;

              return (
                <g
                  key={`vert-room-${idx}`}
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => onSelectRoom(roomNumber)}
                  onMouseEnter={() => setHoveredRoom(roomNumber)}
                  onMouseLeave={() => setHoveredRoom(null)}
                >
                  {/* Room Cell Rectangle */}
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={matching ? colors.bg : "#cbd5e1"}
                    stroke={isSelected ? "#00244e" : isHovered ? "#1e293b" : "#64748b"}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.75}
                    opacity={matching ? 1 : 0.4}
                    rx="1"
                  />
                  {/* Highlight ring for selected */}
                  {isSelected && (
                    <rect
                      x={x - 2}
                      y={y - 2}
                      width={w + 4}
                      height={h + 4}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      rx="3"
                    />
                  )}
                  {/* Room Number */}
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 3.5}
                    fill={colors.text}
                    fontSize="9.5"
                    fontWeight="700"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {roomNumber}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ======================================================== */}
          {/* HORIZONTAL WING ROOM CELLS (236 - 254) */}
          {/* ======================================================== */}
          <g>
            {horizontalRooms.map((roomNumber, idx) => {
              const roomData = rooms[roomNumber] || {
                number: roomNumber,
                status: "Clean",
                floor: "2nd",
                type: "1 King Bed",
              };
              const status = roomData.status;
              const colors = STATUS_COLORS[status] || STATUS_COLORS.Clean;
              const matching = isMatch(status);
              const isSelected = selectedRoom === roomNumber;
              const isHovered = hoveredRoom === roomNumber;

              const x = 427 + idx * 23.2;
              const y = 572;
              const w = 23.2;
              const h = 33;

              return (
                <g
                  key={`horiz-room-${idx}`}
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => onSelectRoom(roomNumber)}
                  onMouseEnter={() => setHoveredRoom(roomNumber)}
                  onMouseLeave={() => setHoveredRoom(null)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={matching ? colors.bg : "#cbd5e1"}
                    stroke={isSelected ? "#00244e" : isHovered ? "#1e293b" : "#64748b"}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.75}
                    opacity={matching ? 1 : 0.4}
                    rx="1"
                  />
                  {isSelected && (
                    <rect
                      x={x - 2}
                      y={y - 2}
                      width={w + 4}
                      height={h + 4}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      rx="3"
                    />
                  )}
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 3.5}
                    fill={colors.text}
                    fontSize="9.5"
                    fontWeight="700"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {roomNumber}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ======================================================== */}
          {/* AMENITY & SERVICE BADGES ON BUILDING */}
          {/* ======================================================== */}

          {/* 1. Main Lobby / Check-In Pin (Pink/Magenta Circle with Bed) */}
          <g transform="translate(412, 160)" filter="url(#mapShadow)">
            <circle cx="0" cy="0" r="11" fill="#ec4899" stroke="#ffffff" strokeWidth="2" />
            <path
              d="M -5 2 L -5 -2 L -1 -2 L -1 2 Z M 1 2 L 1 -2 L 5 -2 L 5 2 Z M -6 3 L 6 3 M -6 5 L -6 1 M 6 5 L 6 1"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* 2. Ice / Vending Machine (North Corridor) */}
          <g transform="translate(442, 260)" filter="url(#mapShadow)">
            <rect
              x="0"
              y="0"
              width="16"
              height="26"
              rx="2"
              fill="#1e40af"
              stroke="#ffffff"
              strokeWidth="1"
            />
            {/* Ice Machine Icon */}
            <circle cx="8" cy="8" r="2.5" fill="#ffffff" />
            <rect x="4" y="14" width="8" height="8" rx="1" fill="#93c5fd" />
          </g>

          {/* 3. Elevator Badge (Mid Corridor) */}
          <g transform="translate(436, 385)" filter="url(#mapShadow)">
            <rect
              x="0"
              y="0"
              width="16"
              height="26"
              rx="2"
              fill="#1e40af"
              stroke="#ffffff"
              strokeWidth="1"
            />
            {/* Elevator Up/Down Arrows */}
            <path d="M 8 7 L 5 11 L 11 11 Z M 8 19 L 5 15 L 11 15 Z" fill="#ffffff" />
          </g>

          {/* 4. Stairs Badge (Bottom Corner) */}
          <g transform="translate(403, 568)" filter="url(#mapShadow)">
            <rect
              x="0"
              y="0"
              width="16"
              height="26"
              rx="2"
              fill="#1e40af"
              stroke="#ffffff"
              strokeWidth="1"
            />
            {/* Stairs step lines */}
            <path
              d="M 4 20 L 7 20 L 7 16 L 10 16 L 10 12 L 13 12 L 13 8"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </g>

        {/* 7. Compass Rose (North Arrow) */}
        <g transform="translate(775, 140)">
          <circle
            cx="0"
            cy="0"
            r="14"
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth="1.5"
            opacity="0.9"
          />
          {/* Black & White Compass Arrow Pointer */}
          <polygon points="0,-11 4,0 0,-3" fill="#0f172a" />
          <polygon points="0,-11 -4,0 0,-3" fill="#64748b" />
          <polygon points="0,11 4,0 0,3" fill="#cbd5e1" />
          <polygon points="0,11 -4,0 0,3" fill="#94a3b8" />
          <text x="0" y="-14" fill="#0f172a" fontSize="10" fontWeight="800" textAnchor="middle">
            N
          </text>
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredRoom && rooms[hoveredRoom] && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none rounded-xl bg-slate-900/90 backdrop-blur-md px-3.5 py-2 text-white shadow-xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight">Room {hoveredRoom}</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
              style={{
                backgroundColor: STATUS_COLORS[rooms[hoveredRoom].status].bg,
                color: STATUS_COLORS[rooms[hoveredRoom].status].text,
              }}
            >
              {rooms[hoveredRoom].status}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-300">
            {rooms[hoveredRoom].type} • Floor {rooms[hoveredRoom].floor}
          </div>
        </div>
      )}
    </div>
  );
}

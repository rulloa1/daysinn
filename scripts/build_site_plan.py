#!/usr/bin/env python3
"""Generate the property site plan and the room-pin coordinate table.

The SVG drawing and DEFAULT_ROOM_COORDS come from the same geometry, so every
pin lands on its own room cell by construction.  Re-run after changing the
layout:

    python3 scripts/build_site_plan.py

Writes:
    src/assets/property-site-plan.svg
    /tmp/site_plan_coords.json   (consumed by the floor-plan patch step)
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_SVG = os.path.join(ROOT, "src", "assets", "property-site-plan.svg")
OUT_JSON = os.path.join("/tmp", "site_plan_coords.json")

# -*- coding: utf-8 -*-
"""Generate a clean, pin-free site plan for Days Inn Wildwood plus the room
pin coordinate table.  Both come from the same geometry, so pins land exactly
on their room cells by construction."""

W, H = 1600.0, 1000.0

# ---- building envelope ----------------------------------------------------
WING_TOP, WING_BOT = 700.0, 850.0          # horizontal wing band
COURT_ROW = (WING_TOP, 775.0)              # courtyard-facing row (even rooms)
PARK_ROW = (775.0, WING_BOT)               # parking-facing row  (odd rooms)

LOBBY_X0, LOBBY_X1 = 90.0, 330.0           # service block / rooms 200-207 above
MAIN_X0, MAIN_X1 = 330.0, 1170.0           # 14 bays, rooms 108-135 / 208-235

VWING_X0, VWING_X1 = 1170.0, 1320.0        # vertical wing
VCOURT_COL = (VWING_X0, 1245.0)            # courtyard-facing column (evens)
VPARK_COL = (1245.0, VWING_X1)             # parking-facing column  (odds)
VWING_Y0, VWING_Y1 = 100.0, 700.0          # 14 bays, south -> north

COURT = (MAIN_X0, 150.0, MAIN_X1, WING_TOP)  # courtyard
POOL = (700.0, 250.0, 1000.0, 430.0)

coords = {}          # room number -> (left%, top%)
cells = []           # (x0, y0, x1, y1, label, kind)

def pct(x, y):
    return (round(x / W * 100, 2), round(y / H * 100, 2))

# floor offset so both floors stay readable in the "All" view
DY = 17.0            # horizontal wing: stack floors vertically inside the cell
DX = 17.0            # vertical wing:   stack floors side by side

# ---- horizontal wing: main run, 14 bays -----------------------------------
BAYS = 14
bw = (MAIN_X1 - MAIN_X0) / BAYS
for i in range(BAYS):
    x0 = MAIN_X0 + i * bw
    cx = x0 + bw / 2
    even, odd = 108 + i * 2, 109 + i * 2          # ground floor
    cells.append((x0, COURT_ROW[0], x0 + bw, COURT_ROW[1], "", "room"))
    cells.append((x0, PARK_ROW[0], x0 + bw, PARK_ROW[1], "", "room"))
    cy_court = (COURT_ROW[0] + COURT_ROW[1]) / 2
    cy_park = (PARK_ROW[0] + PARK_ROW[1]) / 2
    coords[str(even)] = pct(cx, cy_court + DY)
    coords[str(odd)] = pct(cx, cy_park + DY)
    coords[str(even + 100)] = pct(cx, cy_court - DY)
    coords[str(odd + 100)] = pct(cx, cy_park - DY)

# ---- lobby / service block, 4 bays (rooms 200-207 on the upper floor) ------
SERVICES = ["GM OFFICE", "KITCHEN", "LOBBY", "SECURITY"]
lb = (LOBBY_X1 - LOBBY_X0) / 4
for i in range(4):
    x0 = LOBBY_X0 + i * lb
    cx = x0 + lb / 2
    cells.append((x0, WING_TOP, x0 + lb, WING_BOT, SERVICES[i], "service"))
    coords[str(200 + i * 2)] = pct(cx, (COURT_ROW[0] + COURT_ROW[1]) / 2 - DY)
    coords[str(201 + i * 2)] = pct(cx, (PARK_ROW[0] + PARK_ROW[1]) / 2 - DY)

# ---- vertical wing, 14 bays south -> north --------------------------------
vh = (VWING_Y1 - VWING_Y0) / BAYS
for i in range(BAYS):
    y1 = VWING_Y1 - i * vh
    cy = y1 - vh / 2
    even, odd = 136 + i * 2, 137 + i * 2
    cells.append((VCOURT_COL[0], y1 - vh, VCOURT_COL[1], y1, "", "room"))
    cells.append((VPARK_COL[0], y1 - vh, VPARK_COL[1], y1, "", "room"))
    cx_court = (VCOURT_COL[0] + VCOURT_COL[1]) / 2
    cx_park = (VPARK_COL[0] + VPARK_COL[1]) / 2
    coords[str(even)] = pct(cx_court - DX, cy)
    coords[str(odd)] = pct(cx_park - DX, cy)
    coords[str(even + 100)] = pct(cx_court + DX, cy)
    coords[str(odd + 100)] = pct(cx_park + DX, cy)

# terminal upper-floor room at the north end
cells.append((VPARK_COL[0], VWING_Y0 - 46, VPARK_COL[1], VWING_Y0, "", "room"))
coords["265"] = pct((VPARK_COL[0] + VPARK_COL[1]) / 2, VWING_Y0 - 23)

# rooms that are not part of the inventory
for gone in ("237", "239"):
    coords.pop(gone, None)



C = {
    "pave":   "#d9dce1",
    "pave2":  "#cfd3d9",
    "stall":  "#ffffff",
    "grass":  "#bcd3a4",
    "grass2": "#a9c78e",
    "walk":   "#e8eaed",
    "roof":   "#f4f5f7",
    "roofl":  "#ffffff",
    "line":   "#8b93a1",
    "line2":  "#5c6473",
    "ink":    "#2b3240",
    "pool":   "#5fc0e8",
    "pooldk": "#2f9dcb",
    "svc":    "#e6e1d3",
    "brand":  "#1f3864",
}

p = []
a = p.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif">')
a('<defs>')
a('<linearGradient id="roofg" x1="0" y1="0" x2="0" y2="1">'
  f'<stop offset="0" stop-color="{C["roofl"]}"/><stop offset="1" stop-color="{C["roof"]}"/></linearGradient>')
a('<linearGradient id="poolg" x1="0" y1="0" x2="1" y2="1">'
  f'<stop offset="0" stop-color="{C["pool"]}"/><stop offset="1" stop-color="{C["pooldk"]}"/></linearGradient>')
a('</defs>')

# ---- ground ---------------------------------------------------------------
a(f'<rect width="{W:.0f}" height="{H:.0f}" fill="{C["pave"]}"/>')
# grass verges
a(f'<rect x="0" y="0" width="{W:.0f}" height="34" fill="{C["grass2"]}"/>')
a(f'<rect x="0" y="{H-34:.0f}" width="{W:.0f}" height="34" fill="{C["grass2"]}"/>')
a(f'<rect x="0" y="0" width="34" height="{H:.0f}" fill="{C["grass2"]}"/>')
a(f'<rect x="{W-34:.0f}" y="0" width="34" height="{H:.0f}" fill="{C["grass2"]}"/>')

def stalls(x0, y0, x1, y1, vertical, step=42):
    """Parking stall striping."""
    out = [f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{x1-x0:.1f}" height="{y1-y0:.1f}" fill="{C["pave2"]}"/>']
    if vertical:
        n = int((x1 - x0) / step)
        for i in range(1, n + 1):
            x = x0 + i * (x1 - x0) / (n + 1)
            out.append(f'<line x1="{x:.1f}" y1="{y0:.1f}" x2="{x:.1f}" y2="{y1:.1f}" stroke="{C["stall"]}" stroke-width="2.5"/>')
    else:
        n = int((y1 - y0) / step)
        for i in range(1, n + 1):
            y = y0 + i * (y1 - y0) / (n + 1)
            out.append(f'<line x1="{x0:.1f}" y1="{y:.1f}" x2="{x1:.1f}" y2="{y:.1f}" stroke="{C["stall"]}" stroke-width="2.5"/>')
    return "".join(out)

# parking bands
a(stalls(60, 890, 1180, 962, True))        # front / south parking
a(stalls(1360, 120, 1552, 860, False))     # east / front parking
a(stalls(60, 60, 1140, 128, True))         # north / back parking
a(stalls(60, 170, 300, 640, False))        # west truck parking

# landscaping islands
a(f'<rect x="330" y="170" width="820" height="500" rx="10" fill="{C["grass"]}"/>')
a(f'<rect x="1200" y="150" width="120" height="0" fill="none"/>')

# courtyard walkways
a(f'<rect x="330" y="640" width="820" height="30" fill="{C["walk"]}"/>')
a(f'<rect x="690" y="170" width="26" height="500" fill="{C["walk"]}"/>')

# pool deck + pool
px0, py0, px1, py1 = POOL
a(f'<rect x="{px0-38:.0f}" y="{py0-38:.0f}" width="{px1-px0+76:.0f}" height="{py1-py0+76:.0f}" rx="8" fill="{C["walk"]}" stroke="{C["line"]}" stroke-width="1.5"/>')
a(f'<rect x="{px0:.0f}" y="{py0:.0f}" width="{px1-px0:.0f}" height="{py1-py0:.0f}" rx="6" fill="url(#poolg)" stroke="{C["pooldk"]}" stroke-width="2"/>')
a(f'<text x="{(px0+px1)/2:.0f}" y="{(py0+py1)/2+7:.0f}" text-anchor="middle" font-size="21" font-weight="700" fill="#ffffff" letter-spacing="2">SWIM POOL</text>')
# pool equipment
a(f'<rect x="1030" y="292" width="86" height="70" rx="4" fill="{C["svc"]}" stroke="{C["line2"]}" stroke-width="1.5"/>')
a(f'<text x="1073" y="322" text-anchor="middle" font-size="11" font-weight="700" fill="{C["ink"]}">POOL</text>')
a(f'<text x="1073" y="337" text-anchor="middle" font-size="11" font-weight="700" fill="{C["ink"]}">EQUIP.</text>')

# ---- building shell -------------------------------------------------------
a(f'<path d="M{LOBBY_X0} {WING_TOP} H{VWING_X1} V{VWING_Y0-46} H{VPARK_COL[0]} V{VWING_Y0} H{VWING_X0} V{WING_BOT} H{LOBBY_X0} Z" '
  f'fill="url(#roofg)" stroke="{C["line2"]}" stroke-width="3" stroke-linejoin="round"/>')

# room + service cells
for x0, y0, x1, y1, label, kind in cells:
    fill = C["svc"] if kind == "service" else "none"
    a(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{x1-x0:.1f}" height="{y1-y0:.1f}" fill="{fill}" stroke="{C["line"]}" stroke-width="1.2"/>')
    if label:
        a(f'<text x="{(x0+x1)/2:.0f}" y="{y1-9:.0f}" text-anchor="middle" font-size="8.5" font-weight="800" fill="{C["ink"]}" letter-spacing="0.4">{label}</text>')

# row divider between the two room depths
a(f'<line x1="{LOBBY_X1}" y1="{COURT_ROW[1]}" x2="{MAIN_X1}" y2="{COURT_ROW[1]}" stroke="{C["line2"]}" stroke-width="2"/>')
a(f'<line x1="{VCOURT_COL[1]}" y1="{VWING_Y0}" x2="{VCOURT_COL[1]}" y2="{VWING_Y1}" stroke="{C["line2"]}" stroke-width="2"/>')
# lobby block separation
a(f'<line x1="{LOBBY_X1}" y1="{WING_TOP}" x2="{LOBBY_X1}" y2="{WING_BOT}" stroke="{C["line2"]}" stroke-width="2.5"/>')
# corner block
a(f'<rect x="{VWING_X0}" y="{WING_TOP}" width="{VWING_X1-VWING_X0}" height="{WING_BOT-WING_TOP}" fill="{C["walk"]}" stroke="{C["line2"]}" stroke-width="2"/>')
a(f'<text x="{(VWING_X0+VWING_X1)/2:.0f}" y="{WING_TOP+70:.0f}" text-anchor="middle" font-size="11" font-weight="700" fill="{C["ink"]}">BREEZEWAY</text>')

# laundry / storage outbuilding
a(f'<rect x="90" y="880" width="180" height="72" rx="4" fill="{C["svc"]}" stroke="{C["line2"]}" stroke-width="2"/>')
a(f'<text x="180" y="910" text-anchor="middle" font-size="11.5" font-weight="700" fill="{C["ink"]}">LAUNDRY AND</text>')
a(f'<text x="180" y="926" text-anchor="middle" font-size="11.5" font-weight="700" fill="{C["ink"]}">STORAGE</text>')

# ---- area labels ----------------------------------------------------------
def tag(x, y, text, anchor="middle"):
    wpx = len(text) * 8.7 + 34
    a(f'<rect x="{x-wpx/2:.0f}" y="{y-15:.0f}" width="{wpx:.0f}" height="24" rx="5" fill="{C["brand"]}"/>')
    a(f'<text x="{x:.0f}" y="{y+2:.0f}" text-anchor="{anchor}" font-size="12" font-weight="700" fill="#ffffff" letter-spacing="1.2">{text}</text>')

tag(600, 96, "BACK PARKING")
tag(192, 160, "TRUCK PARKING (GUEST)")
tag(1450, 160, "FRONT PARKING")
tag(620, 986, "MAIN ENTRANCE")
a(f'<text x="500" y="560" text-anchor="middle" font-size="19" font-weight="700" fill="#5d7a44" letter-spacing="4">COURTYARD</text>')

# north arrow + scale
a(f'<g transform="translate(1440,930)"><circle r="26" fill="#ffffff" stroke="{C["line2"]}" stroke-width="2"/>'
  f'<path d="M0 -17 L9 13 L0 6 L-9 13 Z" fill="{C["ink"]}"/>'
  f'<text x="0" y="-30" text-anchor="middle" font-size="13" font-weight="800" fill="{C["ink"]}">N</text></g>')

a('</svg>')
svg = "\n".join(p)
open(OUT_SVG, 'w', encoding='utf-8').write(svg)



# ---- facility markers (percent of the drawing) ----------------------------
FACILITIES = {
    "Swim Pool": pct((POOL[0] + POOL[2]) / 2, (POOL[1] + POOL[3]) / 2),
    "Lobby / Registration / Breakfast": pct(LOBBY_X0 + (LOBBY_X1 - LOBBY_X0) * 5 / 8, 838),
    "GM Office": pct(LOBBY_X0 + (LOBBY_X1 - LOBBY_X0) * 1 / 8, 838),
    "Kitchen": pct(LOBBY_X0 + (LOBBY_X1 - LOBBY_X0) * 3 / 8, 838),
    "Security": pct(LOBBY_X0 + (LOBBY_X1 - LOBBY_X0) * 7 / 8, 838),
    "Laundry and Storage": pct(180, 916),
    "Stairs (East Wing)": pct((VWING_X0 + VWING_X1) / 2, WING_TOP + 75),
    "Stairs (North Breezeway)": pct(LOBBY_X1, WING_TOP - 20),
    "Stairs (South Facility)": pct(300, 880),
    "Pool Equipment": pct(1073, 327),
    "Truck Parking (Guest)": pct(180, 400),
    "Back Parking": pct(600, 94),
    "Front Parking": pct(1450, 480),
    "Main Entrance": pct(620, 975),
}

json.dump({"coords": coords, "facilities": FACILITIES}, open(OUT_JSON, "w"), indent=2)
print("rooms:", len(coords))
print("svg:", OUT_SVG)

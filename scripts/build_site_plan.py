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
POOL = (860.0, 355.0, 1000.0, 600.0)   # portrait, long axis parallel to the east wing
POOL_HOUSE = (790.0, 320.0, 1060.0, 625.0)

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


# ---------------------------------------------------------------------------
# Drawing.  Palette and composition follow the property site-plan reference:
# dark asphalt lot, planted perimeter, lawns either side of the courtyard
# walk, portrait pool beside the east wing, porte-cochere and entry canopy.
# ---------------------------------------------------------------------------
C = {
    "page":    "#d6e0ea",
    "asphalt": "#666b73",
    "asphalt2": "#5d626a",
    "stall":   "#ffffff",
    "grass":   "#7cae57",
    "grass2":  "#6ea24b",
    "grass3":  "#8cbb66",
    "tree":    "#4f8f3b",
    "treel":   "#6fb04c",
    "treesh":  "#3c6b2d",
    "walk":    "#e9ecef",
    "roof":    "#f3f5f7",
    "roofl":   "#ffffff",
    "roofed":  "#c6ccd4",
    "line":    "#aeb5bf",
    "line2":   "#7b828d",
    "ink":     "#2b3240",
    "pool":    "#3fb3e0",
    "pooldk":  "#1f93c4",
    "svc":     "#ece7d8",
    "brand":   "#1f3864",
    "acc":     "#2f6fb5",
}

p = []
a = p.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif">')
a('<defs>')
a('<linearGradient id="roofg" x1="0" y1="0" x2="0" y2="1">'
  f'<stop offset="0" stop-color="{C["roofl"]}"/><stop offset="1" stop-color="{C["roof"]}"/></linearGradient>')
a('<linearGradient id="poolg" x1="0" y1="0" x2="1" y2="1">'
  f'<stop offset="0" stop-color="{C["pool"]}"/><stop offset="1" stop-color="{C["pooldk"]}"/></linearGradient>')
a('<pattern id="hatch" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">'
  f'<rect width="14" height="14" fill="none"/><line x1="0" y1="0" x2="0" y2="14" stroke="{C["stall"]}" stroke-width="5"/></pattern>')
a('<filter id="bshadow" x="-12%" y="-12%" width="130%" height="130%">'
  '<feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#0d1b2a" flood-opacity="0.32"/></filter>')
a('<filter id="softshadow" x="-30%" y="-30%" width="170%" height="170%">'
  '<feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0d1b2a" flood-opacity="0.28"/></filter>')
a('</defs>')

# ---- lot -------------------------------------------------------------------
a(f'<rect width="{W:.0f}" height="{H:.0f}" fill="{C["page"]}"/>')
a(f'<rect x="18" y="18" width="{W-36:.0f}" height="{H-36:.0f}" rx="26" fill="{C["asphalt"]}"/>')

# ---- planted perimeter -----------------------------------------------------
def tree(x, y, r=15.0):
    return (f'<circle cx="{x:.0f}" cy="{y+3:.0f}" r="{r:.0f}" fill="{C["treesh"]}" opacity="0.5"/>'
            f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="{C["tree"]}" filter="url(#softshadow)"/>'
            f'<circle cx="{x-r*0.3:.0f}" cy="{y-r*0.3:.0f}" r="{r*0.52:.0f}" fill="{C["treel"]}"/>')

# grass verges hugging the lot edge
a(f'<rect x="18" y="18" width="{W-36:.0f}" height="60" rx="24" fill="{C["grass2"]}"/>')
a(f'<rect x="18" y="{H-60:.0f}" width="{W-36:.0f}" height="42" rx="22" fill="{C["grass2"]}"/>')
a(f'<rect x="18" y="18" width="62" height="{H-36:.0f}" rx="24" fill="{C["grass2"]}"/>')
a(f'<rect x="{W-80:.0f}" y="18" width="62" height="{H-36:.0f}" rx="24" fill="{C["grass2"]}"/>')
# east landscape strip
a(f'<rect x="{W-150:.0f}" y="80" width="66" height="{H-190:.0f}" rx="14" fill="{C["grass"]}"/>')

STEP = 52.0
for i in range(int((W - 150) / STEP) + 1):
    x = 78 + i * STEP
    if x < W - 70:
        a(tree(x, 48))
        a(tree(x, H - 39, 13))
for i in range(int((H - 150) / STEP) + 1):
    y = 96 + i * STEP
    if y < H - 80:
        a(tree(48, y))
        a(tree(W - 48, y))
        a(tree(W - 117, y))

# ---- lawns either side of the courtyard walk -------------------------------
a(f'<rect x="250" y="232" width="400" height="408" rx="12" fill="{C["grass"]}"/>')
a(f'<rect x="676" y="232" width="104" height="408" rx="12" fill="{C["grass"]}"/>')
for tx, ty in ((330, 320), (470, 290), (590, 400), (360, 520), (520, 590), (728, 300), (728, 470), (728, 600)):
    a(tree(tx, ty, 19))

# ---- parking ---------------------------------------------------------------
def stalls(x0, y0, x1, y1, vertical, step=46.0):
    """A parking band: apron plus stall striping."""
    out = [f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{x1-x0:.1f}" height="{y1-y0:.1f}" fill="{C["asphalt2"]}"/>']
    if vertical:
        n = max(1, int((x1 - x0) / step))
        for i in range(1, n + 1):
            x = x0 + i * (x1 - x0) / (n + 1)
            out.append(f'<line x1="{x:.1f}" y1="{y0:.1f}" x2="{x:.1f}" y2="{y1:.1f}" stroke="{C["stall"]}" stroke-width="3"/>')
    else:
        n = max(1, int((y1 - y0) / step))
        for i in range(1, n + 1):
            y = y0 + i * (y1 - y0) / (n + 1)
            out.append(f'<line x1="{x0:.1f}" y1="{y:.1f}" x2="{x1:.1f}" y2="{y:.1f}" stroke="{C["stall"]}" stroke-width="3"/>')
    return "".join(out)

# back-of-house rows either side of the north drive aisle
a(stalls(300, 96, 1140, 150, True))
a(stalls(300, 158, 1000, 212, True))
# east rows either side of the drive aisle serving the vertical wing
a(stalls(1345, 120, 1450, 700, False))
a(stalls(1345, 700, 1450, 860, False))
# front rows along the main entrance drive
a(stalls(500, 858, 1150, 930, True))

# accessible stalls beside each entrance
def accessible(x, y, w=62.0, h=54.0):
    cx, cy = x + w / 2, y + h / 2
    return (f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{C["acc"]}"/>'
            f'<circle cx="{cx:.0f}" cy="{cy-11:.0f}" r="5" fill="#ffffff"/>'
            f'<path d="M{cx-9:.0f} {cy+13:.0f} a11 11 0 1 1 15 -9" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>'
            f'<path d="M{cx-1:.0f} {cy-4:.0f} h8 l5 12" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')

a(accessible(506, 866))
a(accessible(1074, 866))

# painted crosswalk hatching at the two entries
a(f'<path d="M1152 858 h70 v72 h-70 Z" fill="url(#hatch)" opacity="0.85"/>')
a(f'<path d="M228 130 h96 v46 h-96 Z" fill="url(#hatch)" opacity="0.85"/>')

# ---- drives ----------------------------------------------------------------
a(f'<path d="M96 210 q0 -96 108 -96 h120" fill="none" stroke="{C["stall"]}" stroke-width="4"/>')
a(f'<path d="M96 210 V820 q0 96 108 96 h150" fill="none" stroke="{C["stall"]}" stroke-width="4"/>')

# ---- courtyard walkways ----------------------------------------------------
a(f'<rect x="{MAIN_X0:.0f}" y="640" width="{MAIN_X1-MAIN_X0:.0f}" height="30" fill="{C["walk"]}"/>')
a(f'<rect x="650" y="232" width="26" height="408" fill="{C["walk"]}"/>')

# ---- pool house + pool -----------------------------------------------------
hx0, hy0, hx1, hy1 = POOL_HOUSE
a(f'<rect x="{hx0:.0f}" y="{hy0:.0f}" width="{hx1-hx0:.0f}" height="{hy1-hy0:.0f}" rx="6" fill="{C["roof"]}" stroke="{C["roofed"]}" stroke-width="3" filter="url(#bshadow)"/>')
px0, py0, px1, py1 = POOL
a(f'<rect x="{px0:.0f}" y="{py0:.0f}" width="{px1-px0:.0f}" height="{py1-py0:.0f}" rx="5" fill="url(#poolg)" stroke="{C["pooldk"]}" stroke-width="3"/>')
# lounge chairs down the deck
for i in range(8):
    cy = hy0 + 34 + i * 33
    a(f'<rect x="{hx0+14:.0f}" y="{cy:.0f}" width="26" height="22" rx="3" fill="{C["roofl"]}" stroke="{C["line"]}" stroke-width="1.6"/>')
# pool ladders
for ly in (py0 + 12, py1 - 34):
    a(f'<rect x="{px0+18:.0f}" y="{ly:.0f}" width="22" height="22" rx="2" fill="none" stroke="{C["roofl"]}" stroke-width="3"/>')
a(f'<text x="{(px0+px1)/2:.0f}" y="{(py0+py1)/2-4:.0f}" text-anchor="middle" font-size="19" font-weight="800" fill="#ffffff" letter-spacing="1.5">SWIM</text>')
a(f'<text x="{(px0+px1)/2:.0f}" y="{(py0+py1)/2+18:.0f}" text-anchor="middle" font-size="19" font-weight="800" fill="#ffffff" letter-spacing="1.5">POOL</text>')
# pool equipment / restrooms
a(f'<rect x="{hx0+6:.0f}" y="{hy0-62:.0f}" width="62" height="52" rx="4" fill="{C["svc"]}" stroke="{C["line2"]}" stroke-width="2"/>')

# ---- building shell --------------------------------------------------------
a(f'<path d="M{LOBBY_X0} {WING_TOP} H{VWING_X1} V{VWING_Y0-46} H{VPARK_COL[0]} V{VWING_Y0} H{VWING_X0} V{WING_BOT} H{LOBBY_X0} Z" '
  f'fill="url(#roofg)" stroke="{C["roofed"]}" stroke-width="3" stroke-linejoin="round" filter="url(#bshadow)"/>')

for x0, y0, x1, y1, label, kind in cells:
    fill = C["svc"] if kind == "service" else "none"
    a(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{x1-x0:.1f}" height="{y1-y0:.1f}" fill="{fill}" stroke="{C["line"]}" stroke-width="1.2"/>')
    if label:
        a(f'<text x="{(x0+x1)/2:.0f}" y="{y1-9:.0f}" text-anchor="middle" font-size="8.5" font-weight="800" fill="{C["ink"]}" letter-spacing="0.4">{label}</text>')

a(f'<line x1="{LOBBY_X1}" y1="{COURT_ROW[1]}" x2="{MAIN_X1}" y2="{COURT_ROW[1]}" stroke="{C["line2"]}" stroke-width="2"/>')
a(f'<line x1="{VCOURT_COL[1]}" y1="{VWING_Y0}" x2="{VCOURT_COL[1]}" y2="{VWING_Y1}" stroke="{C["line2"]}" stroke-width="2"/>')
a(f'<line x1="{LOBBY_X1}" y1="{WING_TOP}" x2="{LOBBY_X1}" y2="{WING_BOT}" stroke="{C["line2"]}" stroke-width="2.5"/>')

# porte-cochere off the lobby, entry canopy at the east elbow
a(f'<rect x="180" y="{WING_BOT:.0f}" width="300" height="88" rx="5" fill="{C["roofl"]}" stroke="{C["roofed"]}" stroke-width="3" filter="url(#softshadow)"/>')
a(f'<text x="330" y="{WING_BOT+53:.0f}" text-anchor="middle" font-size="13" font-weight="800" fill="{C["ink"]}" letter-spacing="1">PORTE-COCHÈRE</text>')
a(f'<rect x="{VWING_X0:.0f}" y="{WING_BOT:.0f}" width="{VWING_X1-VWING_X0:.0f}" height="88" rx="5" fill="{C["roofl"]}" stroke="{C["roofed"]}" stroke-width="3" filter="url(#softshadow)"/>')
a(f'<text x="{(VWING_X0+VWING_X1)/2:.0f}" y="{WING_BOT+53:.0f}" text-anchor="middle" font-size="13" font-weight="800" fill="{C["ink"]}" letter-spacing="1">CANOPY</text>')

# ---- labels ----------------------------------------------------------------
def tag(x, y, text):
    wpx = len(text) * 8.7 + 34
    a(f'<rect x="{x-wpx/2:.0f}" y="{y-16:.0f}" width="{wpx:.0f}" height="26" rx="5" fill="{C["brand"]}"/>')
    a(f'<text x="{x:.0f}" y="{y+2:.0f}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff" letter-spacing="1.2">{text}</text>')

tag(1072, 190, "BACK ENTRANCE")
tag(760, 970, "MAIN ENTRANCE")

# north arrow
a(f'<g transform="translate(1462,905)"><circle r="27" fill="#ffffff" stroke="{C["line2"]}" stroke-width="2"/>'
  f'<path d="M0 -18 L10 14 L0 6 L-10 14 Z" fill="{C["ink"]}"/></g>')
a(f'<text x="1462" y="958" text-anchor="middle" font-size="15" font-weight="800" fill="#ffffff">N</text>')
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

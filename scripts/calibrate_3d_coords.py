# Calculate exact coordinates for Days Inn 3D property map

# 1. Horizontal Front Wing
# Roof line (Floor 2): from [14.5, 65.0] at 200/201 to [66.5, 71.5] at 234/235
# Walkway line (Floor 1): from [14.5, 73.5] at 100/101 to [66.5, 80.0] at 134/135

# Pairs 0..17 (rooms 0..35):
# 0: 100/101, 200/201
# 1: 102/103, 202/203
# ...
# 17: 134/135, 234/235

coords = {}

# Front Wing pairs (18 pairs from 0 to 17)
pairs_x = [
    14.5, 17.5, 20.5, 23.5, 26.5, 29.5, 33.0, 36.2, 39.5,
    43.0, 46.5, 49.5, 52.5, 55.5, 58.5, 61.5, 64.5, 67.5
]

for i, x in enumerate(pairs_x):
    r_even_1 = str(100 + i * 2)
    r_odd_1 = str(101 + i * 2)
    r_even_2 = str(200 + i * 2)
    r_odd_2 = str(201 + i * 2)
    
    # Progress along horizontal wing:
    t = i / 17.0
    y_floor2 = round(65.0 + t * 6.5, 1)
    y_floor1 = round(73.5 + t * 6.5, 1)
    
    # Place even and odd:
    # On Floor 2 roof, even is top, odd is bottom or side-by-side
    coords[r_even_2] = [round(x, 1), y_floor2]
    coords[r_odd_2] = [round(x, 1), round(y_floor2 + 1.2, 1) if i % 2 == 1 else y_floor2]
    
    # On Floor 1 ground walkway
    coords[r_even_1] = [round(x, 1), y_floor1]
    coords[r_odd_1] = [round(x, 1), round(y_floor1 + 1.2, 1) if i % 2 == 1 else y_floor1]


# 2. Vertical Wing (136-163 for floor 1, 236-265 for floor 2)
# Slanted corridor from bottom (y=61.0) to top (y=15.0)
# 14 pairs along the vertical wing (index 0..13)
# index 0: 136/137, 236/237 (237 omitted, 241 starts)
# index 13: 162/163, 264/265

for i in range(14):
    t = i / 13.0
    y_center = round(60.0 - t * 44.0, 1)  # 60.0 down to 16.0
    
    # X slant: increases from 61.5 at bottom to 67.5 at top for courtyard,
    # and 70.5 at bottom to 76.5 at top for parking side.
    x_courtyard = round(60.5 + t * 6.5, 1)
    x_parking = round(70.0 + t * 6.5, 1)
    
    even_1 = str(136 + i * 2)
    odd_1 = str(137 + i * 2)
    even_2 = str(236 + i * 2)
    odd_2 = str(237 + i * 2)
    
    # Floor 1
    coords[even_1] = [x_courtyard, y_center]
    coords[odd_1] = [x_parking, y_center]
    
    # Floor 2 (offset slightly on the roof)
    coords[even_2] = [round(x_courtyard + 2.0, 1), round(y_center - 1.0, 1)]
    if odd_2 not in ("237", "239"):
        coords[odd_2] = [round(x_parking + 1.5, 1), round(y_center - 1.0, 1)]

# Extra room 265
coords["265"] = [78.0, 15.0]

import json
print(json.dumps(coords, indent=2))

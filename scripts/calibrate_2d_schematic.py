import numpy as np
from PIL import Image

# Read image
img_path = 'src/assets/property_map_3d.png'
img = Image.open(img_path)
W, H = img.size
print(f"Image Size: {W} x {H}")

# We will define the exact layout based on the schematic:
#
# Vertical Wing:
# Left column (odds on ground, odd 2xx on upper): x_pct_left
# Right column (evens on ground, even 2xx on upper): x_pct_right
#
# Let's locate the vertical wing bounds:
# Wing bounding box: x in [380..680], y in [100..1020]
# Left column center: x = (390 + 535) / 2 = 462.5 -> 462.5 / 2048 = 22.58%
# Right column center: x = (535 + 680) / 2 = 607.5 -> 607.5 / 2048 = 29.66%
#
# Let's inspect the horizontal wing:
# Wing bounding box: x in [710..1760], y in [960..1100] (or similar)
# Row 1 (Ground / top row): y_pct_ground
# Row 2 (Upper / bottom row): y_pct_upper

coords = {}

# Vertical Wing Rows:
# Section 1: Main Building (Rooms 108..117, 208..217)
# Security (L) / 108, 208 (R)
# 111, 211 (L) / 110, 210 (R)
# 113, 213 (L) / 112, 212 (R)
# 115, 215 (L) / 114, 214 (R)
# 117, 217 (L) / 116, 216 (R)

v_left_x = 24.3   # Left column center %
v_right_x = 30.1  # Right column center %

main_bldg_rows = [
    # (left_ground, left_upper, right_ground, right_upper, y_pct)
    ("Security", "Security", "108", "208", 30.4),
    ("111", "211", "110", "210", 34.0),
    ("113", "213", "112", "212", 37.4),
    ("115", "215", "114", "214", 40.8),
    ("117", "217", "116", "216", 44.2),
]

for lg, lu, rg, ru, y in main_bldg_rows:
    if lg != "Security":
        coords[lg] = [v_left_x, y]
        coords[lu] = [v_left_x, y]
    coords[rg] = [v_right_x, y]
    coords[ru] = [v_right_x, y]

# Section 2: Building 2 (Rooms 118..135, 218..235)
bldg2_rows = [
    ("119", "219", "118", "218", 51.0),
    ("121", "221", "120", "220", 54.2),
    ("123", "223", "122", "222", 57.4),
    ("125", "225", "124", "224", 60.6),
    ("127", "227", "126", "226", 63.8),
    ("129", "229", "128", "228", 67.0),
    ("131", "231", "130", "230", 70.2),
    ("133", "233", "132", "232", 73.4),
    ("135", "235", "134", "234", 76.6),
]

for lg, lu, rg, ru, y in bldg2_rows:
    coords[lg] = [v_left_x, y]
    coords[lu] = [v_left_x, y]
    coords[rg] = [v_right_x, y]
    coords[ru] = [v_right_x, y]

# Section 3: Building 3 (Horizontal Wing, Rooms 136..163, 236..265)
# In the schematic:
# Top row is 136, 138, 140, 142, 144, 146, 148, 150, 152, 154, 158, 160, 162 (and odd numbers 137..163)
# Bottom row is 236, 238, 240, 242, 244, 246, 248, 250, 254, 254(256), 258, 260, 262 (and odd numbers 237..265)
h_ground_y = 88.0
h_upper_y = 93.4

# 13 columns from x = 36.8% to 83.5%
h_cols = [
    # (ground_even, ground_odd, upper_even, upper_odd, x_pct)
    ("136", "137", "236", "237", 36.6),
    ("138", "139", "238", "239", 40.5),
    ("140", "141", "240", "241", 44.4),
    ("142", "143", "242", "243", 48.3),
    ("144", "145", "244", "245", 52.2),
    ("146", "147", "246", "247", 56.1),
    ("148", "149", "248", "249", 60.0),
    ("150", "151", "250", "251", 63.9),
    ("152", "153", "252", "253", 67.8),
    ("154", "155", "254", "255", 71.7),
    ("156", "157", "256", "257", 75.6),
    ("158", "159", "258", "259", 75.6), # fallback alias
    ("160", "161", "260", "261", 79.5),
    ("162", "163", "262", "263", 83.4),
    ("164", "165", "264", "265", 83.4),
]

for ge, go, ue, uo, x in h_cols:
    coords[ge] = [x, h_ground_y]
    coords[go] = [x, h_ground_y]
    coords[ue] = [x, h_upper_y]
    coords[uo] = [x, h_upper_y]

print(f"Total mapped rooms: {len(coords)}")
import json
print(json.dumps(coords, indent=2))

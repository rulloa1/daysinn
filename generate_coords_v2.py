import json

coords = {}

# West Wing Y values
west_y_top = [39.5, 42.5, 45.5, 48.5]
west_y_bot = [54.5, 57.5, 60.5, 63.5, 66.5, 69.5, 72.5, 75.5, 78.5]
west_y = west_y_top + west_y_bot

west_odds = [111, 113, 115, 117, 119, 121, 123, 125, 127, 129, 131, 133, 135]
west_evens = [110, 112, 114, 116, 120, 122, 124, 126, 128, 130, 132, 134, 134] 
# Note: property-layout has 134 twice at the end

# North Wing X values
north_x_12 = [29.0 + i * (39.0 / 11) for i in range(12)]
north_x_13 = [29.0 + i * (39.0 / 12) for i in range(13)]

north_top_y = 16.5
north_bot_y = 19.5
north_top_y_2 = 17.5
north_bot_y_2 = 20.5

north_top = [136, 138, 140, 142, 144, 146, 148, 150, 154, 156, 160, 162]
north_bot = [137, 139, 141, 143, 145, 147, 149, 151, 155, 157, 161, 163]

north_top_2 = [236, 238, 240, 242, 244, 246, 248, 250, 254, 258, 260, 262]
north_bot_2 = [237, 239, 241, 243, 245, 247, 251, 253, 255, 259, 261, 263, 265]

# Corner / Front Block
corner_odds = [201, 203, 205, 207, 209]
corner_evens = [200, 202, 204, 206, 208]
corner_y = [17.5 + i * ((31.5 - 17.5) / 4) for i in range(5)]

OFFSET = 1.0 # 2nd floor offset for overlapping boxes

# West Wing Left column (Odd)
for i, num in enumerate(west_odds):
    coords[str(num)] = [23.5, west_y[i]]
    coords[str(num + 100)] = [23.5 + OFFSET, west_y[i] + OFFSET]

# West Wing Right column (Even)
for i, num in enumerate(west_evens):
    if str(num) not in coords: # Avoid duplicate 134
        coords[str(num)] = [27.5, west_y[i]]
        coords[str(num + 100)] = [27.5 + OFFSET, west_y[i] + OFFSET]

# North Wing Top
for i, num in enumerate(north_top):
    coords[str(num)] = [north_x_12[i], north_top_y]
for i, num in enumerate(north_top_2):
    coords[str(num)] = [north_x_12[i], north_top_y_2]

# North Wing Bottom
for i, num in enumerate(north_bot):
    coords[str(num)] = [north_x_12[i], north_bot_y]
for i, num in enumerate(north_bot_2):
    coords[str(num)] = [north_x_13[i], north_bot_y_2]

# Corner
for i, num in enumerate(corner_odds):
    coords[str(num)] = [23.5 + OFFSET, corner_y[i] + OFFSET]
for i, num in enumerate(corner_evens):
    coords[str(num)] = [27.5 + OFFSET, corner_y[i] + OFFSET]

coords['101'] = [23.5, 36.0]
coords['108'] = [27.5, 36.0]

# Print JS object format
out = "const ROOM_COORDS: Record<string, [number, number]> = {\n"
for k, v in coords.items():
    out += f'  "{k}": [{v[0]:.1f}, {v[1]:.1f}],\n'
out += "};\n"

with open('coords_all_v2.txt', 'w') as f:
    f.write(out)
print("Done")

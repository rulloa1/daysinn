import json

coords = {}

# West Wing Y values (13 boxes)
west_y = [36.0 + i * ((76.0 - 36.0) / 12) for i in range(13)]

west_odds = [111, 113, 115, 117, 119, 121, 123, 125, 127, 129, 131, 133, 135]
west_evens = [110, 112, 114, 116, 120, 122, 124, 126, 128, 130, 132, 134] 
# Note: property-layout has 134 twice, we only map it once

# North Wing X values (12 boxes)
north_x = [31.0 + i * ((80.0 - 31.0) / 11) for i in range(12)]
north_top_y = 17.0
north_bot_y = 23.0

north_top = [136, 138, 140, 142, 144, 146, 148, 150, 154, 156, 160, 162]
north_bot = [137, 139, 141, 143, 145, 147, 149, 151, 155, 157, 161, 163]

# Corner / Front Block
corner_odds = [201, 203, 205, 207, 209]
corner_evens = [200, 202, 204, 206, 208]
corner_y = [17.0 + i * ((31.0 - 17.0) / 4) for i in range(5)]

OFFSET = 1.0 # 2nd floor offset

# Left column
for i, num in enumerate(west_odds):
    coords[str(num)] = [18.0, west_y[i]]
    coords[str(num + 100)] = [18.0 + OFFSET, west_y[i] + OFFSET]

# Right column
for i, num in enumerate(west_evens):
    # Map index 4 to 120, etc.
    # The arrays match in length (12 elements vs 13 elements? Wait! 
    # west_odds is 13 elements. west_evens is 12 elements!
    # Because 110,112,114,116 (4) + 120...134 (8) = 12 elements.
    # property-layout.ts has lowerEvens = 120,122,124,126,128,130,132,134,134.
    # So 134 is the 9th element. Let's just map them sequentially.
    pass

# Let's fix west_evens Y mapping.
# 110, 112, 114, 116 -> west_y[0:4]
# 120, 122... 134 -> west_y[4:12]
west_evens_fixed = [110, 112, 114, 116, 120, 122, 124, 126, 128, 130, 132, 134, 134]
for i, num in enumerate(west_evens_fixed):
    if str(num) not in coords:
        coords[str(num)] = [22.0, west_y[i]]
        coords[str(num + 100)] = [22.0 + OFFSET, west_y[i] + OFFSET]

# North Wing Top
for i, num in enumerate(north_top):
    coords[str(num)] = [north_x[i], north_top_y]
    coords[str(num + 100)] = [north_x[i] + OFFSET, north_top_y + OFFSET]

# North Wing Bottom
for i, num in enumerate(north_bot):
    coords[str(num)] = [north_x[i], north_bot_y]
    coords[str(num + 100)] = [north_x[i] + OFFSET, north_bot_y + OFFSET]

# Corner
for i, num in enumerate(corner_odds):
    coords[str(num)] = [18.0 + OFFSET, corner_y[i] + OFFSET]
for i, num in enumerate(corner_evens):
    coords[str(num)] = [22.0 + OFFSET, corner_y[i] + OFFSET]

coords['108'] = [22.0, 31.0]
coords['101'] = [18.0, 31.0] # arbitrary corner

# Print JS object format
out = "const ROOM_COORDS: Record<string, [number, number]> = {\n"
for k, v in coords.items():
    out += f'  "{k}": [{v[0]:.1f}, {v[1]:.1f}],\n'
out += "};\n"

with open('coords_all.txt', 'w') as f:
    f.write(out)
print("Done")

coords = {}

# West Wing
start_y = 35.6
end_y = 75.6
step = (end_y - start_y) / 16
OFFSET = 1.0 

for i in range(17):
    y = start_y + i * step
    # ODD (Left)
    odd_num = 101 + i * 2
    coords[str(odd_num)] = [26.7, y]
    coords[str(odd_num + 100)] = [26.7 + OFFSET, y + OFFSET]
    # EVEN (Right)
    even_num = 102 + i * 2
    coords[str(even_num)] = [30.4, y]
    coords[str(even_num + 100)] = [30.4 + OFFSET, y + OFFSET]


# North Wing
north_x_12 = [29.0, 32.5, 36.1, 39.6, 43.2, 46.7, 50.3, 53.8, 57.4, 60.9, 64.5, 68.0]
north_top_y = 16.5
north_bot_y = 19.5

north_top = [136, 138, 140, 142, 144, 146, 148, 150, 154, 156, 160, 162]
north_bot = [137, 139, 141, 143, 145, 147, 149, 151, 155, 157, 161, 163]

for i, num in enumerate(north_top):
    coords[str(num)] = [north_x_12[i], north_top_y]
    coords[str(num + 100)] = [north_x_12[i] + OFFSET, north_top_y + OFFSET]

for i, num in enumerate(north_bot):
    coords[str(num)] = [north_x_12[i], north_bot_y]
    coords[str(num + 100)] = [north_x_12[i] + OFFSET, north_bot_y + OFFSET]

# Missing 2nd floor rooms in layout for North wing?
# Let's just add 265 at the end
coords['265'] = [68.0 + OFFSET, 20.5 + OFFSET]

# Print JS object format
out = "const ROOM_COORDS: Record<string, [number, number]> = {\n"
for num in sorted(coords.keys(), key=lambda x: int(x)):
    out += f'  "{num}": [{coords[num][0]:.1f}, {coords[num][1]:.1f}],\n'
out += "};\n"

with open("coords_all_v4.txt", "w") as f:
    f.write(out)

print("Done")

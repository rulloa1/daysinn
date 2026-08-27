coords = {}

# User's exact West Wing logic
start_y = 35.6
end_y = 75.6
step = (end_y - start_y) / 16
OFFSET = 1.0 # 2nd floor offset

# West Wing (First Floor)
for i in range(17):
    y = start_y + i * step
    
    # ODD (Left)
    odd_num = 101 + i * 2
    coords[str(odd_num)] = [26.7, y]
    coords[str(odd_num + 100)] = [26.7 + OFFSET, y + OFFSET] # 2nd floor
    
    # EVEN (Right)
    even_num = 102 + i * 2
    coords[str(even_num)] = [30.4, y]
    coords[str(even_num + 100)] = [30.4 + OFFSET, y + OFFSET] # 2nd floor


# North Wing (First Floor)
# Top row (Even numbers), Bottom row (Odd numbers)
# Let's say North wing spans from X=34.0 to X=68.0
north_start_x = 34.0
north_end_x = 68.0
north_rooms_count = 14 # 136 to 162 is 14 even rooms (136, 138, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162)
# Wait, 136 to 162 is exactly 14 rooms: 136,138,140,142,144,146,148,150, 152,154, 156, 158, 160, 162.
# Let's just linearly interpolate X
north_step = (north_end_x - north_start_x) / (north_rooms_count - 1)

north_top_y = 16.5
north_bot_y = 19.5

# Top row (EVEN)
# Wait, the screenshot showed 136 at the left side of the North wing (closest to the lobby).
for i in range(north_rooms_count):
    x = north_start_x + i * north_step
    even_num = 136 + i * 2
    coords[str(even_num)] = [x, north_top_y]
    coords[str(even_num + 100)] = [x, north_top_y + OFFSET] # 2nd floor
    
    odd_num = 137 + i * 2
    coords[str(odd_num)] = [x, north_bot_y]
    coords[str(odd_num + 100)] = [x, north_bot_y + OFFSET] # 2nd floor

# Print JS object format
out = "const ROOM_COORDS: Record<string, [number, number]> = {\n"
for num in sorted(coords.keys(), key=lambda x: int(x)):
    out += f'  "{num}": [{coords[num][0]:.1f}, {coords[num][1]:.1f}],\n'
out += "};\n"

with open("coords_all_v3.txt", "w") as f:
    f.write(out)

print("Done")

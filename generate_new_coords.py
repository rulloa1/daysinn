import json

coords = {}

# 1. Lobby Block (101-109, 201-209)
# Top-Right of the image.
lobby_odd = [101, 103, 105, 107, 109]
lobby_even = [100, 102, 104, 106, 108] # Wait, 100? Assuming 100 is valid based on 200
for i in range(5):
    # Odd (inner, left column)
    coords[str(lobby_odd[i])] = [73.0, 10.0 + i * 3.5]
    coords[str(lobby_odd[i] + 100)] = [73.0 - 1.0, 10.0 + i * 3.5 - 1.0] # 2nd floor offset
    
    # Even (outer, right column)
    coords[str(lobby_even[i])] = [81.0, 10.0 + i * 3.5]
    coords[str(lobby_even[i] + 100)] = [81.0 - 1.0, 10.0 + i * 3.5 - 1.0]

# 2. Vertical Wing (110-135)
# Extends down from Lobby on the right side.
for i in range(13):
    odd_num = 111 + i * 2
    even_num = 110 + i * 2
    
    y = 29.0 + i * 3.25
    
    # Odd (inner, left column)
    coords[str(odd_num)] = [74.0, y]
    coords[str(odd_num + 100)] = [74.0 - 1.0, y - 1.0]
    
    # Even (outer, right column)
    coords[str(even_num)] = [82.0, y]
    coords[str(even_num + 100)] = [82.0 - 1.0, y - 1.0]

# 3. Horizontal Wing (136-163)
# Extends left from the bottom of the Vertical Wing.
for i in range(14):
    even_num = 136 + i * 2
    odd_num = 137 + i * 2
    
    # X goes from right (70.0) to left (20.0)
    x = 70.0 - i * 3.84
    
    # Odd (inner, top row)
    coords[str(odd_num)] = [x, 75.0]
    coords[str(odd_num + 100)] = [x - 1.0, 75.0 - 1.0]
    
    # Even (outer, bottom row)
    coords[str(even_num)] = [x, 82.0]
    coords[str(even_num + 100)] = [x - 1.0, 82.0 - 1.0]

# Extra rooms: 265
coords["265"] = [15.0, 75.0]

print("const ROOM_COORDS: Record<string, [number, number]> = {")
for k, v in sorted(coords.items(), key=lambda x: int(x[0])):
    print(f'  "{k}": [{v[0]:.1f}, {v[1]:.1f}],')
print("};")

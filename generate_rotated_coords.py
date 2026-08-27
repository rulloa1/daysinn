import json

coords = {}

# Original coordinates inferred from the property_map.png before rotation
# Corner is around X=23, Y=16.

# Rotated mapping: NewX = 100 - OldY, NewY = OldX

# 1. Horizontal Wing (111-135 on top, 110-134 on bottom)
# Extends to the left from the Lobby (Top-Right).
# In rotated image, X goes from ~80 down to ~20. Y is around 20-30.

# 13 rooms on outer, 13 rooms on inner.
for i in range(13):
    odd_num = 111 + i * 2
    even_num = 110 + i * 2
    
    # Original Y went from ~34 to ~85 (length = 51) for 13 rooms.
    # Step = 51 / 12 = 4.25.
    old_y = 36.0 + i * 4.25
    
    # Outer (odd) was old_x = 23.5
    # Inner (even) was old_x = 27.5
    
    # Rotate: NewX = 100 - OldY, NewY = OldX
    coords[str(odd_num)] = [100 - old_y, 23.5]
    coords[str(odd_num + 100)] = [100 - old_y - 1.0, 24.5] # 2nd floor

    coords[str(even_num)] = [100 - old_y, 27.5]
    coords[str(even_num + 100)] = [100 - old_y - 1.0, 28.5] # 2nd floor

# 2. Vertical Wing (136-162 on left, 137-163 on right)
# Extends down from the Lobby.
# In rotated image, Y goes from ~30 down to ~80. X is around 80-90.

for i in range(14):
    even_num = 136 + i * 2
    odd_num = 137 + i * 2
    
    # Original X went from ~29 to ~68 (length = 39) for 14 rooms.
    # Step = 39 / 13 = 3.0.
    old_x = 29.0 + i * 3.0
    
    # Outer (even) was old_y = 16.5
    # Inner (odd) was old_y = 19.5
    
    # Rotate: NewX = 100 - OldY, NewY = OldX
    coords[str(even_num)] = [100 - 16.5, old_x]
    coords[str(even_num + 100)] = [100 - 17.5, old_x + 1.0] # 2nd floor

    coords[str(odd_num)] = [100 - 19.5, old_x]
    coords[str(odd_num + 100)] = [100 - 20.5, old_x + 1.0] # 2nd floor

# Lobby block
lobby_rooms = ["201", "203", "205", "207", "209"]
for i, num in enumerate(lobby_rooms):
    old_x = 24.5
    old_y = 18.5 + i * 3.5
    coords[num] = [100 - old_y, old_x]

lobby_even = ["200", "202", "204", "206", "208"]
for i, num in enumerate(lobby_even):
    old_x = 28.5
    old_y = 18.5 + i * 3.5
    coords[num] = [100 - old_y, old_x]

# Extra rooms: 265
coords["265"] = [100 - 20.5, 68.0 + 3.0]

print("const ROOM_COORDS: Record<string, [number, number]> = {")
for k, v in sorted(coords.items(), key=lambda x: int(x[0])):
    print(f'  "{k}": [{v[0]:.1f}, {v[1]:.1f}],')
print("};")

# Exact calibrated coordinates based on 3D building perspective

pairs_x = [
    14.5, 17.5, 20.5, 23.5, 26.5, 29.5, 33.0, 36.2, 39.5,
    43.0, 46.5, 49.5, 52.5, 55.5, 58.5, 61.5, 64.5, 67.5
]

coords = {}

# Horizontal Wing:
# Floor 2 Roof: Y goes from 57.5 to 63.0
# Floor 1 Walkway: Y goes from 67.0 to 71.5
for i, x in enumerate(pairs_x):
    t = i / 17.0
    y_floor2 = round(57.5 + t * 5.5, 1)
    y_floor1 = round(67.0 + t * 4.5, 1)
    
    r_even_1 = str(100 + i * 2)
    r_odd_1 = str(101 + i * 2)
    r_even_2 = str(200 + i * 2)
    r_odd_2 = str(201 + i * 2)
    
    coords[r_even_2] = [round(x, 1), y_floor2]
    coords[r_odd_2] = [round(x, 1), round(y_floor2 + 0.8, 1) if i % 2 == 1 else y_floor2]
    
    coords[r_even_1] = [round(x, 1), y_floor1]
    coords[r_odd_1] = [round(x, 1), round(y_floor1 + 0.8, 1) if i % 2 == 1 else y_floor1]

# Vertical Wing:
# 15 steps along vertical wing from corner (top=67.0) to north end (top=11.0)
for i in range(15):
    t = i / 14.0
    y = round(67.0 - t * 56.0, 1)  # 67.0 down to 11.0
    
    # Slant of building towards top-right:
    x_courtyard_f1 = round(63.0 + t * 7.0, 1)
    x_courtyard_f2 = round(64.5 + t * 7.0, 1)
    x_parking_f1 = round(74.0 + t * 7.0, 1)
    x_parking_f2 = round(73.0 + t * 7.0, 1)
    
    even_num = 136 + i * 2
    odd_num = 137 + i * 2
    
    # Floor 1
    if even_num <= 164:
        coords[str(even_num)] = [x_courtyard_f1, y]
    if odd_num <= 165:
        coords[str(odd_num)] = [x_parking_f1, y]
        
    # Floor 2
    even_num_2 = 236 + i * 2
    odd_num_2 = 237 + i * 2
    if even_num_2 <= 264:
        coords[str(even_num_2)] = [x_courtyard_f2, y]
    if odd_num_2 <= 265 and str(odd_num_2) not in ("237", "239"):
        coords[str(odd_num_2)] = [x_parking_f2, y]

import json
print(json.dumps(coords, indent=2))

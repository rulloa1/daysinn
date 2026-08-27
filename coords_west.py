start_y = 35.6
end_y = 75.6
step = (end_y - start_y) / 16

print('// ODD')
for i in range(17):
    y = start_y + i * step
    num = 101 + i * 2
    print(f'"{num}": [26.7, {y:.1f}],')

print('// EVEN')
for i in range(17):
    y = start_y + i * step
    num = 102 + i * 2
    print(f'"{num}": [30.4, {y:.1f}],')

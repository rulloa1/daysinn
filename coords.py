start = 30.4
end = 74.8
step = (end - start) / 16
for i in range(17):
    x = start + i * step
    print(f'"{201+i*2}": [{x:.1f}, 17.0],')
print('---')
for i in range(17):
    x = start + i * step
    print(f'"{202+i*2}": [{x:.1f}, 24.5],')

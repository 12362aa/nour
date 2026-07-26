# -*- coding: utf-8 -*-
with open('src/data/asma-ul-husna.ts', 'r', encoding='utf8') as f:
    lines = f.readlines()
    count = 0
    for line in lines:
        if 'name:' in line:
            count += 1
    print(f"Total names found: {count}")
    print("Sample of first name:")
    print("".join(lines[9:17]))
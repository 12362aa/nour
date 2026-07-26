# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
matches = re.finditer(r'toLocaleTimeString.*?\)|\.format\(.*?\)', code)
for m in matches:
    print(m.group(0))
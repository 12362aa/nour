# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
matches = re.finditer(r'function toArabicNumber.*?\n\}', code, re.DOTALL)
for m in matches:
    print(m.group(0))
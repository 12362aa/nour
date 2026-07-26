# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
match = re.search(r'function NamesScreen.*?</Screen>\s*\);\s*\}', code, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("Not found")
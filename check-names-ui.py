# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
match = re.search(r'function NamesScreen.*?return \(\s*<Screen.*?</Screen>\s*\);.*?\}', code, re.DOTALL)
if match:
    print(match.group(0)[:500])
else:
    print("Not found")
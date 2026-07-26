# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
match = re.search(r'function AboutScreen.*?return \(\s*<View.*?</View>\s*\);.*?\}', code, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("Not found")
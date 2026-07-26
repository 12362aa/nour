# -*- coding: utf-8 -*-
with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
match = re.search(r'export function NamesScreen.*?return \(\s*<Screen.*?</Screen>\s*\);.*?\}', code, re.DOTALL)
if match:
    with open('namesscreen_extract.txt', 'w', encoding='utf8') as out:
        out.write(match.group(0))
else:
    print("Not found")
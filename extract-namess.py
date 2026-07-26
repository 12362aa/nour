# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
match = re.search(r'function NameDetail.*?return \(\s*<Screen.*?</Screen>\s*\);.*?\}', code, re.DOTALL)
if match:
    with open('namedetail_extract.txt', 'w', encoding='utf8') as out:
        out.write(match.group(0))

match2 = re.search(r'function NamesScreen.*?return \(\s*<Screen.*?</Screen>\s*\);.*?\}', code, re.DOTALL)
if match2:
    with open('namesscreen_extract.txt', 'w', encoding='utf8') as out:
        out.write(match2.group(0))
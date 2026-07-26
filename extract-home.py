# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
match = re.search(r'function HomeScreen.*?return \(\s*<Screen.*?</ScrollView>\s*</View>\s*\);.*?\}', code, re.DOTALL)
if match:
    with open('home_screen_extract.txt', 'w', encoding='utf8') as out:
        out.write(match.group(0))
else:
    print("Not found")
# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

match = re.search(r'function AboutScreen.*?return \(\s*<View.*?</ScrollView>\s*</View>\s*\);.*?\}', code, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("Not found")
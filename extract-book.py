# -*- coding: utf-8 -*-
import re

with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

match = re.search(r'export function BookLibraryScreen.*?\}', code, re.DOTALL)
if match:
    print(match.group(0)[:1500]) # First 1500 chars to see rendering
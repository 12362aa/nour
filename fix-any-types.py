# -*- coding: utf-8 -*-
import re

with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('let sub;', 'let sub: any;')
code = code.replace('let cleanup;', 'let cleanup: any;')

with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Fixed any types")
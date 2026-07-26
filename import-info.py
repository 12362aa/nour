# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
code = re.sub(r'import\s*\{([^}]*)Activity', r'import {\1Activity, Info', code)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Imported Info icon")
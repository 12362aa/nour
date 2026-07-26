# -*- coding: utf-8 -*-
import os, re
found = False
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            with open(os.path.join(root, f), 'r', encoding='utf8') as file:
                code = file.read()
                if 'ar-EG' in code or 'ar-SA' in code:
                    print(f"Found in {f}")
                    found = True
if not found:
    print("No ar-EG or ar-SA found")
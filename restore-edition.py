# -*- coding: utf-8 -*-
with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Restore Edition
code = code.replace('export function HadithBooksScreen', 'type Edition = typeof HADITH_EDITIONS[0];\n\nexport function HadithBooksScreen')

with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
    f.write(code)

print("Restored Edition type successfully")
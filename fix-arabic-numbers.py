# -*- coding: utf-8 -*-
with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Remove the regex replace in Hadith number
old_code = '{String(hadith.hadithnumber ?? index + 1).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)])}'
new_code = '{String(hadith.hadithnumber ?? index + 1)}'

code = code.replace(old_code, new_code)

with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Removed arabic numbers from Hadith screen")
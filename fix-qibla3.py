import re
with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

qibla_start = code.find('export function QiblaScreen')
book_start = code.find('export function BookLibraryScreen')

if qibla_start != -1 and book_start != -1:
    with open('qibla_clean.txt', 'r', encoding='utf8') as f2:
        clean_code = f2.read()
    
    code = code[:qibla_start] + clean_code + code[book_start:]
    
    with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
        f.write(code)
    print("Fixed QiblaScreen fully")

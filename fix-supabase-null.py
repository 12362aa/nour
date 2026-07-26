# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()
code = code.replace('await supabase\\n        .from', 'await supabase?\\n        .from')
with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Fixed supabase possibly null")
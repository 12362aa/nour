# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()
code = code.replace('const { data, error } = await supabase?', 'if (!supabase) return;\n      const { data, error } = await supabase')
with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Fixed supabase destructuring")
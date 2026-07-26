# -*- coding: utf-8 -*-

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('import { supabase } from "./lib/supabase";', 'import { supabase } from "./services/auth";')

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Fixed supabase import path")
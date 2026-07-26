# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Fix supabase import
if 'import { supabase }' not in code:
    code = code.replace('import { StatusBar }', 'import { supabase } from "./lib/supabase";\nimport { StatusBar }')

# Fix reflection -> benefit in NamesOfAllahScreen
code = code.replace('item.reflection', 'item.benefit')

# Fix the Modal at line 1122 - Let's just remove any Modal that's outside HomeScreen.
# Since we know where it is, it's better to just regex it out carefully.
# Wait, it's inside NamesOfAllahScreen or some other screen?
# It's at 1122 which is probably another function.
# Let's remove ALL Modals that contain showUpdateModal EXCEPT the one in HomeScreen.
# Actually, I can just find the HomeScreen block, save it, delete all Modals, and restore the one in HomeScreen.
homescreen_idx = code.find('function HomeScreen')
if homescreen_idx != -1:
    next_func_idx = code.find('function ', homescreen_idx + 20)
    homescreen_code = code[homescreen_idx:next_func_idx]
    
    # Remove Modals from rest of the code
    rest_code = code[:homescreen_idx] + code[next_func_idx:]
    modal_regex = r'<Modal visible=\{showUpdateModal\}.*?</Modal>'
    rest_code = re.sub(modal_regex, '', rest_code, flags=re.DOTALL)
    
    code = rest_code[:homescreen_idx] + homescreen_code + rest_code[homescreen_idx:]

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Fixed TS errors in NourApp.tsx")
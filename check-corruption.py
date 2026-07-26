# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()
    
print("Number of replacement characters:", code.count('\ufffd'))
# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('require("../assets/nour-calligraphy.jpg")', 'require("../assets/nour-logo.jpg")')

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated logo in NourApp.tsx")
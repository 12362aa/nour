# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Remove the incorrectly injected Modals
regex = r'<Modal visible=\{showUpdateModal\}.*?</Modal>'
code = re.sub(regex, '', code, flags=re.DOTALL)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Removed bad Modals")
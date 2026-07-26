# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
match = re.search(r'function SplashAnimation.*?return \(\s*<View.*?</View>\s*\);.*?\}', code, re.DOTALL)
if match:
    with open('splash1_extract.txt', 'w', encoding='utf8') as out:
        out.write(match.group(0))
else:
    print("Not found SplashAnimation")

match2 = re.search(r'function AuthenticatedApp.*?return \(\s*<.*?</>\s*\);.*?\}', code, re.DOTALL)
if match2:
    with open('authapp_extract.txt', 'w', encoding='utf8') as out:
        out.write(match2.group(0))
else:
    print("Not found AuthenticatedApp")
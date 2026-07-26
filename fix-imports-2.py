# -*- coding: utf-8 -*-
import re
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Fix ActivityIndicator in react
code = code.replace('import { ActivityIndicator,', 'import {')

# Ensure ActivityIndicator in react-native
rn_import_match = re.search(r'import\s*\{([^}]*)\}\s*from\s*"react-native"', code)
if rn_import_match:
    if 'ActivityIndicator' not in rn_import_match.group(1):
        new_rn_import = rn_import_match.group(0).replace('import {', 'import { ActivityIndicator, ')
        code = code.replace(rn_import_match.group(0), new_rn_import)

# Remove InfoIndicator from react-native (wait, is it there?)
code = re.sub(r'InfoIndicator,\s*', '', code)

# Ensure ChevronUp, ChevronDown, Heart, Search in lucide-react-native
lucide_import_match = re.search(r'import\s*\{([^}]*)\}\s*from\s*"lucide-react-native"', code)
if lucide_import_match:
    icons = lucide_import_match.group(1).split(',')
    icons = [i.strip() for i in icons if i.strip()]
    for icon in ["Heart", "Search", "ChevronDown", "ChevronUp", "Info"]:
        if icon not in icons:
            icons.append(icon)
    new_lucide_import = f'import {{ {", ".join(icons)} }} from "lucide-react-native"'
    code = code.replace(lucide_import_match.group(0), new_lucide_import)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
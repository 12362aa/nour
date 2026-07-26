# -*- coding: utf-8 -*-
import re
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Fix React Native imports
code = re.sub(r'import\s*\{([^}]*)ChevronDown,\s*ChevronUp,\s*Activity,?\s*([^}]*)\}\s*from\s*"react-native";', r'import {\1 \2} from "react-native";', code)

# Ensure ActivityIndicator is imported from react-native
if 'ActivityIndicator' not in re.search(r'import \{[^}]*\}\s*from\s*"react-native"', code).group(0):
    code = re.sub(r'import \{', 'import { ActivityIndicator, ', code, count=1)

# Ensure icons are imported from lucide-react-native
lucide_import = re.search(r'import\s*\{([^}]*)\}\s*from\s*"lucide-react-native";', code)
if lucide_import:
    icons_to_add = ["Heart", "Search", "ChevronDown", "ChevronUp"]
    existing_icons = lucide_import.group(1)
    for icon in icons_to_add:
        if icon not in existing_icons:
            code = code.replace(lucide_import.group(0), lucide_import.group(0).replace('{', f'{{ {icon},', 1))

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
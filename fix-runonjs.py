# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";', 'import Animated, { FadeInDown, FadeIn, runOnJS } from "react-native-reanimated";')

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Added runOnJS to reanimated import")
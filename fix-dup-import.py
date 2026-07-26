# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

bad_import = 'import Animated, { FadeOut, ZoomIn, useSharedValue, withTiming, runOnJS, useAnimatedStyle, Easing } from "react-native-reanimated";'
code = code.replace(bad_import, '')

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Removed duplicate import")
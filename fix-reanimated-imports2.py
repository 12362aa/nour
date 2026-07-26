# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

import re
code = re.sub(r'import Animated, \{[^\}]*\} from "react-native-reanimated";', 'import Animated, { FadeInDown, FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withTiming, withRepeat, Easing } from "react-native-reanimated";', code)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated reanimated imports again")
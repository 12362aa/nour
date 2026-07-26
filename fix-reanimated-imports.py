# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# I will find the react-native-reanimated import
import re
code = re.sub(r'import Animated, \{[^\}]*\} from "react-native-reanimated";', 'import Animated, { FadeInDown, FadeIn, runOnJS, useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";', code)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated reanimated imports")
# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Replace WhatsApp Bot with WhatsApp Support
code = code.replace('بوت واتساب (201004886479+)', 'رقم المطور (201004886479+)')
code = code.replace('يعمل بشكل متقطع للخدمات السريعة (اضغط للمحادثة المباشرة)', 'رقم الدعم الفني للمطور (اضغط للمحادثة المباشرة)')

# Replace Email
code = code.replace('contact@nour-app.org', 'contact@new-idea.info')

# Replace Version Number fallback
code = code.replace('Constants.expoConfig?.version ?? "١.٥"', 'Constants.expoConfig?.version ?? "1.5.1"')

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated developer info")
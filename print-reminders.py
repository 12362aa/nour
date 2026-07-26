# -*- coding: utf-8 -*-
with open('src/services/notificationPlan.ts', 'r', encoding='utf8') as f:
    text = f.read()
    start = text.find('return [')
    end = text.find('];', start)
    print(text[start:end+2])
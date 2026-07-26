# -*- coding: utf-8 -*-
with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    text = f.read()
    print("Number of standard question marks:", text.count('?'))
    print("Number of replacement characters:", text.count('\ufffd'))
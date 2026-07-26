# -*- coding: utf-8 -*-

with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('rotate: deg', 'rotate: ${-heading.value}deg')
code = code.replace('subtitle={محسوب بدقة من }', 'subtitle={محسوب بدقة من , }')
code = code.replace('title={الورد اليومي (}', 'title={الورد اليومي ()}')
code = code.replace('subtitle={متبقي }', 'subtitle={متبقي  أيام}')
code = code.replace('title={الورد اليومي للقرآن (}', 'title={الورد اليومي للقرآن ()}')

with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Fixed missing backticks in RestoredFeatures.tsx")
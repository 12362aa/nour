# -*- coding: utf-8 -*-
with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('- [/] **8. تحسين شاشة البداية (Splash Screen Animation)**', '- [x] **8. تحسين شاشة البداية (Splash Screen Animation)**')
code = code.replace('- [ ] **6. إعادة بناء شاشة أسماء الله الحسنى بالكامل**', '- [/] **6. إعادة بناء شاشة أسماء الله الحسنى بالكامل**')

with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'w', encoding='utf8') as f:
    f.write(code)
print("Marked Task 8 as done, Task 6 as in progress")
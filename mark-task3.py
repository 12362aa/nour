# -*- coding: utf-8 -*-
with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('- [/] **1. شاشة بيضاء فارغة عند فتح كتاب (Reader View)**', '- [x] **1. شاشة بيضاء فارغة عند فتح كتاب (Reader View)**')
code = code.replace('- [ ] **2. الأرقام الإنجليزية في كل التطبيق**', '- [x] **2. الأرقام الإنجليزية في كل التطبيق**')
code = code.replace('- [ ] **3. تحسين شامل للتقويم الهجري (تصميم + تعريب)**', '- [/] **3. تحسين شامل للتقويم الهجري (تصميم + تعريب)**')

with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'w', encoding='utf8') as f:
    f.write(code)
print("Marked Task 2 as done, Task 3 as in progress")
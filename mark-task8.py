# -*- coding: utf-8 -*-
with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('- [/] **5. آلية إعلام المستخدمين بالتحديثات الجديدة (أيقونة i)**', '- [x] **5. آلية إعلام المستخدمين بالتحديثات الجديدة (أيقونة i)**')
code = code.replace('- [ ] **8. تحسين شاشة البداية (Splash Screen Animation)**', '- [/] **8. تحسين شاشة البداية (Splash Screen Animation)**')

with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'w', encoding='utf8') as f:
    f.write(code)
print("Marked Task 5 as done, Task 8 as in progress")
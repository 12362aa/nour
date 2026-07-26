# -*- coding: utf-8 -*-
with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('- [/] **3. تحسين شامل للتقويم الهجري (تصميم + تعريب)**', '- [x] **3. تحسين شامل للتقويم الهجري (تصميم + تعريب)**')
code = code.replace('- [ ] **4. تصحيح معلومات التواصل مع المطور**', '- [x] **4. تصحيح معلومات التواصل مع المطور**')
code = code.replace('- [ ] **5. آلية إعلام المستخدمين بالتحديثات الجديدة (أيقونة i)**', '- [/] **5. آلية إعلام المستخدمين بالتحديثات الجديدة (أيقونة i)**')

with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'w', encoding='utf8') as f:
    f.write(code)
print("Marked Task 3, 4 as done, Task 5 as in progress")
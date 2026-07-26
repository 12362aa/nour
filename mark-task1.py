# -*- coding: utf-8 -*-
with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('- [ ] **1. شاشة بيضاء فارغة عند فتح كتاب (Reader View)**', '- [/] **1. شاشة بيضاء فارغة عند فتح كتاب (Reader View)**')

with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'w', encoding='utf8') as f:
    f.write(code)
print("Marked Task 1 as in progress")
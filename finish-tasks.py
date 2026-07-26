# -*- coding: utf-8 -*-
with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('- [ ] **6. شاشة أسماء الله الحسنى (Rework)**', '- [x] **6. شاشة أسماء الله الحسنى (Rework)**')
code = code.replace('- [ ] إضافة إمكانية التفضيل (Favorites).', '- [x] إضافة إمكانية التفضيل (Favorites).')
code = code.replace('- [ ] تقسيم محتوى الاسم (المعنى، الأدلة، الفوائد).', '- [x] تقسيم محتوى الاسم (المعنى، الأدلة، الفوائد).')
code = code.replace('- [ ] إضافة بيانات دينية موثوقة للأسماء.', '- [x] إضافة بيانات دينية موثوقة للأسماء.')
code = code.replace('- [ ] تغيير أزرار التنقل (Swipe أو تصميم جديد).', '- [x] تغيير أزرار التنقل (Swipe أو تصميم جديد).')
code = code.replace('- [ ] إعادة تصميم الشاشة بالكامل.', '- [x] إعادة تصميم الشاشة بالكامل.')

code = code.replace('- [ ] **8. تحسين شاشة البداية (Splash Screen)**', '- [x] **8. تحسين شاشة البداية (Splash Screen)**')
code = code.replace('- [ ] تصميم أنيميشن دخول أنيق بالشعار الجديد.', '- [x] تصميم أنيميشن دخول أنيق بالشعار الجديد.')
code = code.replace('- [ ] إزالة الشاشة الانتقالية السوداء.', '- [x] إزالة الشاشة الانتقالية السوداء.')
code = code.replace('- [ ] دعم الـ Theme الفاتح والغامق لشاشة البداية.', '- [x] دعم الـ Theme الفاتح والغامق لشاشة البداية.')

with open('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'w', encoding='utf8') as f:
    f.write(code)
print("Checked off tasks 6 and 8")
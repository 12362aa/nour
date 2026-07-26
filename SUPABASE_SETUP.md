# تفعيل الحسابات السحابية

واجهة إنشاء الحساب وتسجيل الدخول جاهزة في التطبيق. تعمل محلياً تلقائياً إن لم تُضف خدمة سحابية؛ ولجعل الحساب نفسه متاحاً على أكثر من جهاز، فعّل Supabase كالتالي:

1. أنشئ مشروعاً في [Supabase](https://supabase.com/dashboard)، ومن **Authentication → Providers** اترك Email مفعّلاً.
2. من **Storage** أنشئ bucket عامّاً باسم `avatars` لصور الحسابات، وأضف سياسات تسمح للمستخدم المسجّل بالرفع داخل مجلده فقط (`(storage.foldername(name))[1] = auth.uid()::text`).
3. عدّل قالبي **Confirm signup** و**Reset password** في Authentication ليحتويا `{{ .Token }}`؛ شاشة نور جاهزة للتحقق من رمزي إنشاء الحساب والاستعادة داخل التطبيق.
4. من **Project Settings → API** انسخ `Project URL` و`Publishable key` فقط. لا تستخدم أبداً `service_role` داخل تطبيق الهاتف.
5. انسخ `.env.example` إلى ملف جديد اسمه `.env` ثم ضع القيم الحقيقية:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
   ```

6. أعد بناء APK. عندها تعمل شاشة الحساب السحابي وتأكيد البريد واستعادة/تغيير كلمة المرور ورفع الصورة الشخصية.

ملف `.env` مستبعد من Git حتى لا تُرفع القيم الخاصة بالبيئة. مفاتيح Supabase العامة مسموح بها في تطبيق العميل؛ مفتاح `service_role` سري ويجب ألا يوضع في Expo أو EAS.

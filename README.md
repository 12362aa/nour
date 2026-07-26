# نور

تطبيق إسلامي عربي مبني بـ Expo SDK 57 وReact Native. الواجهة RTL وتركّز على القرآن والأذكار والراديو ومراجعة الحديث، مع حالات تحميل وفراغ وخطأ واضحة.

## التشغيل

```bash
npm install
npx expo start
```

معاينة الواجهة ممكنة عبر Expo Go، لكن لا تستخدمه لاختبار شاشة الأذان أو إجراءات Notifee الأصلية.

## Development build — مطلوب للأذان الكامل

Notifee وميزة `fullScreenAction` تحتاجان development build خاصاً، وليس Expo Go:

```bash
npx eas-cli@latest build --platform android --profile development
npx expo start --dev-client
```

يطلب `app.json` أذونات Android للتنبيهات والمنبّهات الدقيقة و`USE_FULL_SCREEN_INTENT`. على Android 14+ قد يحتاج المستخدم أيضاً إلى تفعيل **Full-screen notifications** من إعدادات النظام. تعمل شاشة القفل الكاملة على Android؛ لا يضمن iOS فتح تطبيق فوق شاشة القفل بالطريقة نفسها.

## اختبار Android الحقيقي

1. ثبّت development build على هاتف فعلي، ثم امنح أذونات الإشعارات والمنبّهات.
2. افتح «الرئيسية» واضغط «اختبار» ضمن بطاقة شاشة الأذان.
3. اقفل الهاتف وانتظر خمس ثوانٍ، ثم اختبر الإيقاف والتأجيل ٥ دقائق و«سجلت: صليت».
4. اختبر بحث القرآن والتفسير، ثم افصل الإنترنت بعد فتح الأذكار مرة واحدة للتأكد من ظهور النسخة المخزنة.
5. اختبر الراديو وتذكير الذكر الصوتي، بما فيه «التالي» و«تخطي» و«إغلاق».

## المصادر والتخزين

- UmmahAPI هو المصدر الأول للقرآن والتفسير وأسماء الله الحسنى ومواقيت اليوم.
- AlQuran Cloud وQuranEnc هما بديلان HTTPS للقرآن والتفسير؛ مسار QuranEnc الصحيح هو `arabic_moyassar`.
- الأذكار تأتي من لقطة Git ثابتة من `nawafalqari/azkar-api`. الرابط المتحرك على `main` يعيد 404 حالياً، لذلك ثُبّتت اللقطة العاملة في الكود.
- تحفظ استجابات المحتوى كاملة محلياً بصيغة JSON في AsyncStorage بعد أول تحميل ناجح، لذلك لا يختفي المحتوى بعد نجاح التحميل الأول.
- راديو القرآن من `data-rosy.vercel.app`، والتحقق من الحديث من `dorar.net`.

## فحوصات المشروع

```bash
npx tsc --noEmit
npx expo-doctor
```

## أهم الملفات

- `src/NourApp.tsx`: الواجهة الجديدة، حالات الشاشة، الصوت، والتنقل.
- `src/services/content.ts`: طبقة HTTPS موحّدة مع مهلة وإعادات محاولة وتسجيل سبب الخطأ الحقيقي وبدائل المصادر.
- `src/services/fullScreenNotifications.ts`: أذان Notifee والتأجيل وإجراءات الخلفية.
- `assets/illustrations/error-state.png`: الرسم المخصص لنافذة الخطأ.
- `eas.json`: ملف development build وAPK الداخلي.

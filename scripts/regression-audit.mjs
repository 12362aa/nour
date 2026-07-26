import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("src/NourApp.tsx");
const content = read("src/services/content.ts");
const radio = app.slice(app.indexOf("function RadioScreen"), app.indexOf("function LibraryScreen"));

const required = [
  ["مسار القبلة", "route === \"qibla\""],
  ["مكتبة نور", "route === \"books\""],
  ["كتب الحديث الستة", "route === \"hadith-books\""],
  ["إدارة الحساب", "route === \"account\""],
  ["أدوات الزكاة ورمضان", "route === \"tools\""],
  ["الوضع الداكن", "setDarkMode"],
  ["وقت 12 ساعة", "formatPrayerTime"],
  ["جرس التنبيه", "BellOff"],
  ["شاشة المزيد", 'route === "more"'],
  ["بحث القرآن", "searchQuran"],
  ["الإشعار المركزي", "scheduleNotification"],
  ["تسجيل الدخول", "NourAuthProvider"],
];

const failures = required
  .filter(([, needle]) => !app.includes(needle))
  .map(([label]) => `اختفت ميزة: ${label}`);

if (content.includes("ar_muyassar")) failures.push("عاد مسار QuranEnc القديم الذي يعيد 404");
if (!content.includes("searchBundledQuran")) failures.push("بحث القرآن المحلي غير مربوط");
if (!content.includes("arabic_moyassar")) failures.push("مسار التفسير العامل غير موجود");
if (!content.includes("searchDorar") || !content.includes("lookupHadeethEnc")) failures.push("سلسلة التحقق من الحديث ناقصة");
if (!radio.includes('addListener("playbackStatusUpdate"') || !radio.includes("player.current.pause()")) failures.push("زر إيقاف الراديو غير مربوط بكائن الصوت");
if (app.includes("development build") || app.includes("تفاصيل تقنية") || app.includes("UmmahAPI")) failures.push("نص تقني ظاهر للمستخدم داخل الواجهة");

const notificationSource = read("src/services/notifications.ts");
const schedulerSource = read("src/services/notificationScheduler.ts");
const scheduledCalls = (schedulerSource.match(/Notifications\.scheduleNotificationAsync\(/g) ?? []).length;
if (!notificationSource.includes("AZKAR_MORNING_CHANNEL") || !notificationSource.includes("AZKAR_EVENING_CHANNEL")) failures.push("missing azkar channels");
if (!notificationSource.includes("...reminderSound(reminder.id)")) failures.push("reminders do not select their own sound");

const auth = read("src/services/auth.ts");
if (!auth.includes('makeRedirectUri({ scheme: "nour" })') || !auth.includes("getGoogleRedirectUri")) failures.push("Google redirect is not a native deep link");
if (!auth.includes("signInWithOtp") || !auth.includes('type: "email"')) failures.push("real email OTP flow is missing");
if (!read("src/features/RestoredFeatures.tsx").includes("GoogleSignInButton")) failures.push("Google button is missing from Account");
if (notificationSource.includes("Notifications.scheduleNotificationAsync(")) failures.push("تم تجاوز مجدول الإشعارات المركزي");
if (scheduledCalls !== 1) failures.push("يوجد أكثر من بدائي جدولة Expo");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: required.length + 4 }, null, 2));

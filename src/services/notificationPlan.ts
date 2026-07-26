export type ReminderSettings = {
  morning: boolean;
  evening: boolean;
  dailyQuran: boolean;
  hadith: boolean;
  witr: boolean;
  fridayKahf: boolean;
  fridaySalawat: boolean;
  fastDays: boolean;
};

export type PrayerAlertSettings = Record<
  "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha",
  boolean
>;

export const DEFAULT_PRAYER_ALERTS: PrayerAlertSettings = {
  Fajr: true,
  Sunrise: true,
  Dhuhr: true,
  Asr: true,
  Maghrib: true,
  Isha: true,
};

export const DEFAULT_REMINDERS: ReminderSettings = {
  morning: true,
  evening: true,
  dailyQuran: true,
  hadith: true,
  witr: true,
  fridayKahf: true,
  fridaySalawat: true,
  fastDays: false,
};

export type PrayerSourceDay = {
  date: { gregorian: { date: string } };
  timings: Record<string, string>;
  meta: { timezone: string };
};

export type PrayerTarget = {
  id: string;
  key: string;
  arabic: string;
  target: Date;
  date: string;
  silent: boolean;
};

export type ReminderTarget = {
  id: string;
  title: string;
  body: string;
  target: Date;
  date: string;
};

type ReminderDefinition = {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  enabled: boolean;
  matches: (date: Date) => boolean;
};

import { createZonedTarget, cleanTime } from "./timeService";

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isSafelyFuture(target: Date, now: Date) {
  return (target.getTime() - now.getTime()) / 1000 > 60;
}

function reminderDefinitions(settings: ReminderSettings): ReminderDefinition[] {
  return [
    {
      id: "morning",
      title: "صباحك نور",
      body: "ورد أذكار الصباح ينتظرك.",
      hour: 7,
      minute: 15,
      enabled: settings.morning,
      matches: () => true,
    },
    {
      id: "quran",
      title: "ورد القرآن",
      body: "آية واحدة اليوم قد تصنع فرقاً.",
      hour: 9,
      minute: 0,
      enabled: settings.dailyQuran,
      matches: () => true,
    },
    {
      id: "hadith",
      title: "حديث اليوم",
      body: "خصّص دقيقة لهدي النبي ﷺ.",
      hour: 11,
      minute: 0,
      enabled: settings.hadith,
      matches: () => true,
    },
    {
      id: "evening",
      title: "أذكار المساء",
      body: "اطمئن بذكر الله قبل انشغال المساء.",
      hour: 18,
      minute: 0,
      enabled: settings.evening,
      matches: () => true,
    },
    {
      id: "witr",
      title: "لا تنس الوتر",
      body: "اختم يومك بركعة الوتر.",
      hour: 22,
      minute: 15,
      enabled: settings.witr,
      matches: () => true,
    },
    {
      id: "kahf",
      title: "جمعة مباركة · سورة الكهف",
      body: "اقرأ سورة الكهف وأنر ما بين الجمعتين.",
      hour: 8,
      minute: 0,
      enabled: settings.fridayKahf,
      matches: (date) => date.getDay() === 5,
    },
    {
      id: "salawat",
      title: "أكثروا من الصلاة على النبي ﷺ",
      body: "من أفضل أعمال يوم الجمعة.",
      hour: 14,
      minute: 0,
      enabled: settings.fridaySalawat,
      matches: (date) => date.getDay() === 5,
    },
    {
      id: "monday-fast",
      title: "تذكير صيام الاثنين",
      body: "هل تنوي صيام غدٍ؟",
      hour: 20,
      minute: 0,
      enabled: settings.fastDays,
      matches: (date) => date.getDay() === 0,
    },
    {
      id: "thursday-fast",
      title: "تذكير صيام الخميس",
      body: "هل تنوي صيام غدٍ؟",
      hour: 20,
      minute: 0,
      enabled: settings.fastDays,
      matches: (date) => date.getDay() === 3,
    },
  ];
}

export function buildPrayerTargets(
  days: PrayerSourceDay[],
  muteToday: boolean,
  now: Date,
  alerts: PrayerAlertSettings = DEFAULT_PRAYER_ALERTS,
) {
  const names = [
    { key: "Fajr", arabic: "الفجر" },
    { key: "Sunrise", arabic: "الشروق" },
    { key: "Dhuhr", arabic: "الظهر" },
    { key: "Asr", arabic: "العصر" },
    { key: "Maghrib", arabic: "المغرب" },
    { key: "Isha", arabic: "العشاء" },
  ];
  const targets: PrayerTarget[] = [];
  let skippedPast = 0;
  for (const day of days) {
    // We only need the date to pass to createZonedTarget
    const [d, m, y] = day.date.gregorian.date.split("-").map(Number);
    const baseDate = new Date(y, m - 1, d);
    
    for (const prayer of names) {
      if (!alerts[prayer.key as keyof PrayerAlertSettings]) continue;
      const time = cleanTime(day.timings[prayer.key]);
      if (!time) continue;
      
      const target = createZonedTarget(baseDate, time, day.meta.timezone);
      
      if (!isSafelyFuture(target, now)) {
        skippedPast += 1;
        continue;
      }
      targets.push({
        id: `${dateKey(target)}:${prayer.key}`,
        key: prayer.key,
        arabic: prayer.arabic,
        target,
        date: dateKey(target),
        silent: muteToday && target.toDateString() === now.toDateString(),
      });
    }
  }
  return { targets, skippedPast };
}

export function buildReminderTargets(
  settings: ReminderSettings,
  now: Date,
  daysCount = 30,
) {
  const definitions = reminderDefinitions(settings).filter(
    (item) => item.enabled,
  );
  const targets: ReminderTarget[] = [];
  let skippedPast = 0;

  for (let dayOffset = 0; dayOffset < daysCount; dayOffset += 1) {
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    for (const reminder of definitions) {
      if (!reminder.matches(baseDate)) continue;
      const target = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        reminder.hour,
        reminder.minute,
        0,
        0,
      );
      if (!isSafelyFuture(target, now)) {
        skippedPast += 1;
        continue;
      }
      targets.push({
        id: `${reminder.id}:${dateKey(target)}`,
        title: reminder.title,
        body: reminder.body,
        target,
        date: dateKey(target),
      });
    }
  }
  return { targets, skippedPast };
}

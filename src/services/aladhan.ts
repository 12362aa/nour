import { FALLBACK_TIMINGS, PRAYER_LABELS } from '../data/islamic';
import { Coordinates, PrayerTiming } from '../types';
import { getCachedJson, setCachedJson } from './storage';

export type AladhanDay = { 
  date: { gregorian: { date: string } }; 
  timings: Record<string, string>;
  meta: { timezone: string };
};
type AladhanResponse<T> = { code: number; data: T };

const cleanTime = (value = '') => value.replace(/\s*\(.+?\)/g, '').trim().slice(0, 5);

export const toPrayerTimings = (timings: Record<string, string>): PrayerTiming[] =>
  (Object.keys(PRAYER_LABELS) as (keyof typeof PRAYER_LABELS)[]).map((name) => ({
    name,
    arabic: PRAYER_LABELS[name].arabic,
    icon: PRAYER_LABELS[name].icon,
    time: cleanTime(timings[name]),
  }));

export const fallbackPrayerTimings = () => toPrayerTimings(FALLBACK_TIMINGS);

export async function getMonthlyCalendar(date: Date, point: Coordinates, method: number) {
  const key = `calendar:${date.getFullYear()}:${date.getMonth() + 1}:${point.latitude.toFixed(3)}:${point.longitude.toFixed(3)}:${method}`;
  const cached = await getCachedJson<AladhanDay[]>(key);
  if (cached) return cached;

  const url = `https://api.aladhan.com/v1/calendar/${date.getFullYear()}/${date.getMonth() + 1}?latitude=${point.latitude}&longitude=${point.longitude}&method=${method}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('تعذر جلب مواقيت الصلاة');
  const body = (await response.json()) as AladhanResponse<AladhanDay[]>;
  if (body.code !== 200) throw new Error('لم تصل مواقيت صحيحة من الخدمة');
  await setCachedJson(key, body.data);
  return body.data;
}

export async function getTodayTimings(date: Date, point: Coordinates, method: number) {
  const days = await getMonthlyCalendar(date, point, method);
  const key = [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear()].join('-');
  const today = days.find((day) => day.date.gregorian.date === key) ?? days[date.getDate() - 1];
  if (!today) throw new Error('لا توجد مواقيت لهذا التاريخ');
  return toPrayerTimings(today.timings);
}

export async function getQibla(point: Coordinates) {
  const response = await fetch(`https://api.aladhan.com/v1/qibla/${point.latitude}/${point.longitude}`);
  const body = (await response.json()) as AladhanResponse<{ direction: number }>;
  return body.data.direction;
}

export type HijriInfo = { date: string; day: number; month: number; monthName: string; year: string; weekday: string };

export async function getHijriInfo(date: Date): Promise<HijriInfo> {
  const formatted = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const response = await fetch(`https://api.aladhan.com/v1/gToH/${formatted}`);
  const body = (await response.json()) as AladhanResponse<{ hijri: { date: string; day: string; month: { number: number; ar: string }; year: string; weekday: { ar: string } } }>;
  const hijri = body.data.hijri;
  return { date: hijri.date, day: Number(hijri.day), month: hijri.month.number, monthName: hijri.month.ar, year: hijri.year, weekday: hijri.weekday.ar };
}

export async function getHijriDate(date: Date) {
  const hijri = await getHijriInfo(date);
  return `${hijri.weekday}، ${hijri.date} ${hijri.monthName} ${hijri.year} هـ`;
}

export function getIslamicOccasions(hijri: HijriInfo) {
  const occasions = [
    { month: 1, day: 1, title: 'رأس السنة الهجرية', note: 'بداية عام هجري جديد' },
    { month: 1, day: 10, title: 'يوم عاشوراء', note: 'يُستحب صيام التاسع والعاشر' },
    { month: 7, day: 27, title: 'ليلة الإسراء والمعراج', note: 'مناسبة إيمانية' },
    { month: 8, day: 15, title: 'منتصف شعبان', note: 'ليلة مباركة' },
    { month: 9, day: 1, title: 'بداية رمضان', note: 'شهر الصيام والقرآن' },
    { month: 9, day: 27, title: 'ليلة القدر المرجوة', note: 'تحرّها في العشر الأواخر' },
    { month: 10, day: 1, title: 'عيد الفطر', note: 'تقبّل الله طاعاتكم' },
    { month: 12, day: 9, title: 'يوم عرفة', note: 'من أعظم أيام الدعاء' },
    { month: 12, day: 10, title: 'عيد الأضحى', note: 'تقبّل الله منكم' },
  ];
  return occasions.map((occasion) => ({ ...occasion, daysAway: (occasion.month - hijri.month) * 30 + (occasion.day - hijri.day) })).filter((occasion) => occasion.daysAway >= 0).sort((a, b) => a.daysAway - b.daysAway).slice(0, 3);
}

import { Coordinates } from "../types";
export { Coordinates };
import { getCachedJson, setCachedJson } from "./storage";

export type HijriCalendarDay = {
  gregorian: string;
  hijriDay: number;
  hijriMonth: number;
  hijriMonthName: string;
  hijriYear: string;
  weekday: string;
  occasion?: string;
};

export type UnsplashWallpaper = {
  id: string;
  imageUrl: string;
  fullUrl: string;
  downloadLocation: string;
  author: string;
  authorUrl: string;
};

const OCCASIONS: Record<string, string> = {
  "1-1": "رأس السنة الهجرية",
  "1-10": "يوم عاشوراء",
  "3-12": "المولد النبوي الشريف",
  "7-27": "الإسراء والمعراج",
  "8-15": "النصف من شعبان",
  "9-1": "بداية رمضان",
  "10-1": "عيد الفطر",
  "12-9": "يوم عرفة",
  "12-10": "عيد الأضحى المبارك",
  "12-11": "أيام التشريق",
  "12-12": "أيام التشريق",
  "12-13": "أيام التشريق",
};

export async function getHijriMonth(gregorianMonth: number, gregorianYear: number) {
  const cacheKey = `nour:hijri-calendar-v2:${gregorianMonth}:${gregorianYear}`;
  const stored = await getCachedJson<HijriCalendarDay[]>(cacheKey);
  if (stored) return stored;
  const response = await fetch(
    `https://api.aladhan.com/v1/gToHCalendar/${gregorianMonth}/${gregorianYear}`,
  );
  if (!response.ok) throw new Error(`تعذّر تحميل التقويم الهجري (${response.status})`);
  const payload = (await response.json()) as {
    code?: number;
    data?: Array<{
      gregorian: { date: string };
      hijri: {
        day: string;
        month: { number: number; ar: string };
        year: string;
        weekday: { ar: string };
        holidays?: string[];
      };
    }>;
  };
  if (payload.code !== 200 || !payload.data?.length) {
    throw new Error("لم تصل بيانات تقويم صحيحة");
  }
  const days = payload.data.map((item) => {
    const hijriDay = Number(item.hijri.day);
    const hijriMonth = item.hijri.month.number;
    return {
      gregorian: item.gregorian.date,
      hijriDay,
      hijriMonth,
      hijriMonthName: item.hijri.month.ar,
      hijriYear: item.hijri.year,
      weekday: item.hijri.weekday.ar,
      occasion: OCCASIONS[`${hijriMonth}-${hijriDay}`],
    };
  });
  await setCachedJson(cacheKey, days);
  return days;
}

export function hasUnsplashAccess() {
  return Boolean(process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY);
}

export async function getUnsplashWallpapers() {
  const key = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) return [] as UnsplashWallpaper[];
  const response = await fetch(
    "https://api.unsplash.com/search/photos?query=islamic%20mosque&orientation=portrait&content_filter=high&per_page=12",
    {
      headers: {
        Authorization: `Client-ID ${key}`,
        "Accept-Version": "v1",
      },
    },
  );
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("[nour:wallpapers] Unsplash HTTP error", response.status, details.slice(0, 300));
    throw new Error(`تعذّر تحميل خلفيات الإنترنت حاليًا (${response.status}). الخلفيات المحلية ما زالت متاحة.`);
  }
  const payload = (await response.json()) as {
    results?: Array<{
      id: string;
      urls: { regular: string; full: string };
      links: { download_location: string };
      user: { name: string; links: { html: string } };
    }>;
  };
  return (payload.results ?? []).map((item) => ({
    id: item.id,
    imageUrl: item.urls.regular,
    fullUrl: item.urls.full,
    downloadLocation: item.links.download_location,
    author: item.user.name,
    authorUrl: item.user.links.html,
  }));
}

export async function trackUnsplashDownload(downloadLocation: string) {
  const key = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) return;
  const response = await fetch(downloadLocation, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
  });
  if (!response.ok) {
    console.warn("[nour:wallpapers] Unsplash tracking failed", response.status);
  }
}

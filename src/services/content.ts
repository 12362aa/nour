import { getCachedJson, setCachedJson } from "./storage";
import { getBundledSurah, searchBundledQuran } from "./local-quran";

const UMMAH = "https://ummahapi.com";
const ALQURAN = "https://api.alquran.cloud/v1";
const QURAN_ENC = "https://quranenc.com/api/v1";
// The mutable `main` URL in the original brief now returns 404. This immutable
// commit is intentionally pinned so the complete, reviewed data set stays stable.
const AZKAR_DATASET =
  "https://raw.githubusercontent.com/nawafalqari/azkar-api/56df51279ab6eb86dc2f6202c7de26c8948331c1/azkar.json";

export type ContentErrorKind = "network" | "timeout" | "server" | "request" | "parse";

export class ContentError extends Error {
  readonly kind: ContentErrorKind;
  readonly status?: number;
  readonly url: string;

  constructor(input: {
    kind: ContentErrorKind;
    url: string;
    message: string;
    status?: number;
  }) {
    super(input.message);
    this.name = "ContentError";
    this.kind = input.kind;
    this.status = input.status;
    this.url = input.url;
  }
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function userMessage(error: unknown) {
  if (error instanceof ContentError) {
    if (error.kind === "network") return "تعذر الوصول إلى الشبكة. تحقّق من الاتصال ثم حاول مجدداً.";
    if (error.kind === "timeout" || error.kind === "server") {
      return "الخدمة غير متاحة مؤقتاً. أُعيدت المحاولة تلقائياً ولم تكتمل بعد.";
    }
    if (error.kind === "parse") return "وصلت استجابة غير صالحة من الخدمة. سنحاول مجدداً لاحقاً.";
    return "تعذر إكمال الطلب من الخدمة الآن.";
  }
  // For non-content errors (auth, Supabase, etc.), show the actual error
  // message when available so the user knows what really happened.
  if (error instanceof Error && error.message) return error.message;
  return "حدث خطأ غير متوقع. حاول مجدداً.";
}

export function describeContentError(error: unknown) {
  const isServiceError =
    error instanceof ContentError && (error.kind === "timeout" || error.kind === "server");
  return {
    title: isServiceError
      ? "الخدمة غير متاحة مؤقتاً"
      : error instanceof ContentError
        ? "حدث خطأ في الاتصال"
        : "حدث خطأ",
    message: userMessage(error),
  };
}

async function requestJson<T>(url: string, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "X-Client": "nour-mobile" },
        signal: controller.signal,
      });
      const body = await response.text();
      console.info("[nour:api]", { url, status: response.status, attempt });
      if (!response.ok) {
        throw new ContentError({
          kind: response.status >= 500 ? "server" : "request",
          url,
          status: response.status,
          message: `HTTP ${response.status}: ${body.slice(0, 300)}`,
        });
      }
      try {
        return JSON.parse(body) as T;
      } catch (cause) {
        throw new ContentError({
          kind: "parse",
          url,
          message: `Invalid JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
        });
      }
    } catch (error) {
      const normalized =
        error instanceof ContentError
          ? error
          : new ContentError({
              kind:
                error instanceof Error && error.name === "AbortError" ? "timeout" : "network",
              url,
              message: error instanceof Error ? error.message : String(error),
            });
      console.warn("[nour:api:error]", {
        url,
        attempt,
        kind: normalized.kind,
        status: normalized.status,
        message: normalized.message,
      });
      lastError = normalized;
      if (attempt < attempts && (normalized.kind === "network" || normalized.kind === "timeout" || normalized.kind === "server")) {
        await wait(500 * (attempt + 1));
        continue;
      }
      throw normalized;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const stored = await getCachedJson<T>(key);
  if (stored) return stored;
  const value = await loader();
  await setCachedJson(key, value);
  return value;
}

export type Verse = { number: number; text: string; audio?: string };
export type Surah = { number: number; name: string; englishName: string; verses: Verse[] };
export type SearchResult = { text: string; surah: string; verse: number; surahNumber?: number };

type UmmahEnvelope<T> = { success: boolean; data: T };

export async function getSurah(number: number): Promise<Surah> {
  return getBundledSurah(number);
}

export async function searchQuran(query: string): Promise<SearchResult[]> {
  return searchBundledQuran(query);
}

export async function getTafsir(surah: number, verse: number): Promise<string> {
  return cached(`nour:tafsir:${surah}:${verse}`, async () => {
    try {
      const primary = await requestJson<
        UmmahEnvelope<{ tafsir: { text?: string } }>
      >(`${UMMAH}/api/tafsir/muyassar/surah/${surah}/ayah/${verse}`);
      const text = primary.data?.tafsir?.text;
      if (text) return text;
      throw new Error("UmmahAPI tafsir was empty");
    } catch (primaryError) {
      console.warn("[nour:api:fallback] UmmahAPI tafsir failed", primaryError);
      const fallback = await requestJson<{ result?: { translation?: string } }>(
        `${QURAN_ENC}/translation/aya/arabic_moyassar/${surah}/${verse}`,
      );
      const text = fallback.result?.translation;
      if (!text) throw primaryError;
      return text;
    }
  });
}

export type DhikrItem = { id: string; text: string; count: number; source?: string; benefit?: string };
export type DhikrCategory = { id: string; title: string; items: DhikrItem[] };
type RawDhikr = { content?: unknown; count?: string | number; reference?: string; description?: string };

function cleanDhikrText(input: unknown): string {
  if (input === null || input === undefined) return "";
  let text = "";
  if (Array.isArray(input)) {
    text = input.map(cleanDhikrText).filter(Boolean).join("\n");
  } else if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    text = String(obj.content || obj.text || obj.arabic || obj.value || "");
  } else {
    text = String(input);
  }

  return text
    // Replace escaped newlines (e.g. \n, \r\n) with real newlines
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    // Remove quotes and commas attached to newlines like \n' or '\n or ', '
    .replace(/\n\s*['"]+/g, "\n")
    .replace(/['"]+\s*\n/g, "\n")
    .replace(/['"]\s*,\s*['"]/g, "\n")
    // Remove outer brackets, leading/trailing quotes or commas
    .replace(/^[\['"\s,]+/, "")
    .replace(/[\['"\s,]+$/, "")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .trim();
}

function flattenDhikr(value: unknown): RawDhikr[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenDhikr);
  if (typeof value === "string") return [{ content: value }];
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("content" in obj || "text" in obj || "arabic" in obj) {
      return [obj as RawDhikr];
    }
    return Object.values(obj).flatMap(flattenDhikr);
  }
  return [];
}

export async function getAdhkar(): Promise<DhikrCategory[]> {
  return cached("nour:azkar:v3", async () => {
    const data = await requestJson<Record<string, unknown>>(AZKAR_DATASET);
    return Object.entries(data)
      .map(([title, value], index) => {
        const rawItems = flattenDhikr(value);
        const items: DhikrItem[] = [];

        rawItems.forEach((item, itemIndex) => {
          const rawContent = item.content ?? (item as any).text ?? (item as any).arabic;
          const text = cleanDhikrText(rawContent);
          if (!text) return;

          let source = cleanDhikrText(item.reference);
          if (source) {
            const strippedSource = source.replace(/[\[\]\(\)]/g, "").trim();
            if (text.includes(strippedSource) || text.includes(source)) {
              source = "";
            }
          }

          const benefit = cleanDhikrText(item.description);

          const dhikrItem: DhikrItem = {
            id: `${index}-${itemIndex}`,
            text,
            count: Math.max(1, Number(item.count) || 1),
          };
          if (source) dhikrItem.source = source;
          if (benefit) dhikrItem.benefit = benefit;

          items.push(dhikrItem);
        });

        return {
          id: `azkar-${index}`,
          title: cleanDhikrText(title),
          items,
        };
      })
      .filter((category) => category.items.length > 0);
  });
}

export type RadioStation = { id: number; name: string; url: string; image?: string };
// Curated HTTPS streams verified against the official MP3Quran radio catalog.
// Keeping this list in the app avoids a stale third-party JSON response from
// reintroducing dead stations while still allowing playback without a login.
const RADIO_STATIONS: RadioStation[] = [
  { id: 19, name: "إذاعة القرآن الكريم من القاهرة", url: "https://stream.radiojar.com/8s5u5tpdtwzuv" },
  { id: 14, name: "إذاعة مشاري العفاسي", url: "https://backup.qurango.net/radio/mishary_alafasi" },
  { id: 10, name: "إذاعة ماهر المعيقلي", url: "https://backup.qurango.net/radio/maher" },
  { id: 18, name: "إذاعة ياسر الدوسري", url: "https://backup.qurango.net/radio/yasser_aldosari" },
  { id: 7, name: "إذاعة عبدالباسط عبدالصمد", url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad" },
  { id: 11, name: "إذاعة محمد صديق المنشاوي", url: "https://backup.qurango.net/radio/mohammed_siddiq_alminshawi" },
  { id: 12, name: "إذاعة محمود خليل الحصري", url: "https://backup.qurango.net/radio/mahmoud_khalil_alhussary" },
  { id: 9, name: "إذاعة فارس عباد", url: "https://backup.qurango.net/radio/fares_abbad" },
  { id: 25, name: "الشمائل المحمدية", url: "https://backup.qurango.net/radio/shmaeel" },
  { id: 26, name: "رياض الصالحين", url: "https://backup.qurango.net/radio/riyad" },
  { id: 27, name: "صحيح البخاري", url: "https://backup.qurango.net/radio/saheh-bokharee" },
];

export async function getRadioStations(): Promise<RadioStation[]> {
  return RADIO_STATIONS;
}

import { ASMA_UL_HUSNA, ArabicAllahName } from "../data/asma-ul-husna";

export type AllahName = ArabicAllahName & {
  arabic: string; // compatibility alias for name
};

export async function getAllahNames(): Promise<AllahName[]> {
  return ASMA_UL_HUSNA.map((item) => ({
    ...item,
    arabic: item.name,
  }));
}

export type PrayerTimes = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

export async function getPrayerTimes(latitude: number, longitude: number): Promise<PrayerTimes> {
  const date = new Date().toISOString().slice(0, 10);
  return cached(`nour:prayers:${date}:${latitude.toFixed(2)}:${longitude.toFixed(2)}`, async () => {
    const response = await requestJson<
      UmmahEnvelope<{ prayer_times: Record<string, string> }>
    >(`${UMMAH}/api/prayer-times?latitude=${latitude}&longitude=${longitude}&method=Egyptian`);
    const times = response.data.prayer_times;
    if (!times?.fajr || !times?.isha) throw new Error("UmmahAPI prayer times were empty");
    return {
      Fajr: times.fajr,
      Sunrise: times.sunrise,
      Dhuhr: times.dhuhr,
      Asr: times.asr,
      Maghrib: times.maghrib,
      Isha: times.isha,
    };
  });
}

export type HadithVerification = { text: string; grade?: string; source?: string; takhrij?: string };

function decodeHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractInfoField(info: string, label: string) {
  const labels = [
    "الراوي",
    "المحدث",
    "المصدر",
    "الصفحة أو الرقم",
    "خلاصة حكم المحدث",
  ];
  const following = labels.filter((item) => item !== label).join("|");
  return info.match(new RegExp(`${label}:\\s*(.*?)(?=(?:${following}):|$)`))?.[1]?.trim();
}

function parseDorarHtml(html: string): HadithVerification[] {
  const parsed: Array<HadithVerification | null> = html
    .split(/-{8,}|<br\s*\/?>\s*<br\s*\/?>/i)
    .map((block) => {
      const textHtml = block.match(/<div class="hadith"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
      const infoHtml = block.match(/<div class="hadith-info"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
      if (!textHtml) return null;
      const text = decodeHtml(textHtml).replace(/^\d+\s*-\s*/, "");
      const info = decodeHtml(infoHtml ?? "");
      const narrator = extractInfoField(info, "الراوي");
      const scholar = extractInfoField(info, "المحدث");
      const source = extractInfoField(info, "المصدر");
      const page = extractInfoField(info, "الصفحة أو الرقم");
      return {
        text,
        grade: extractInfoField(info, "خلاصة حكم المحدث"),
        source: [source, scholar].filter(Boolean).join(" · ") || undefined,
        takhrij: [narrator ? `الراوي: ${narrator}` : "", page ? `الصفحة أو الرقم: ${page}` : ""]
          .filter(Boolean)
          .join(" · ") || undefined,
      };
    });
  return parsed
    .filter((item): item is HadithVerification => item !== null && Boolean(item.text))
    .slice(0, 20);
}

async function searchDorar(query: string) {
  const url = `https://dorar.net/dorar_api.json?skey=${encodeURIComponent(query)}&callback=nour`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json,text/javascript,*/*;q=0.01",
        "User-Agent": "Mozilla/5.0 NourMobile/1.3",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ContentError({
        kind: response.status >= 500 ? "server" : "request",
        status: response.status,
        url,
        message: `Dorar HTTP ${response.status}`,
      });
    }
    const body = await response.text();
    const start = body.indexOf("(");
    const end = body.lastIndexOf(")");
    const json = start >= 0 && end > start ? body.slice(start + 1, end) : body;
    const payload = JSON.parse(json) as { ahadith?: { result?: string } };
    return parseDorarHtml(payload.ahadith?.result ?? "");
  } finally {
    clearTimeout(timeout);
  }
}

async function searchUmmahHadith(query: string): Promise<HadithVerification[]> {
  const payload = await requestJson<
    UmmahEnvelope<{
      hadiths?: Array<Record<string, unknown>>;
      results?: Array<Record<string, unknown>>;
    }>
  >(`${UMMAH}/api/hadith/search?q=${encodeURIComponent(query)}&limit=20`);
  const values = payload.data.hadiths ?? payload.data.results ?? [];
  return values
    .map((item) => ({
      text: String(item.arabic ?? item.hadith_arabic ?? item.hadith ?? item.text ?? ""),
      grade: item.grade_arabic ? String(item.grade_arabic) : item.grade ? String(item.grade) : undefined,
      source: item.collection ? String(item.collection) : item.source ? String(item.source) : "الموسوعة الحديثية",
      takhrij: item.reference ? String(item.reference) : undefined,
    }))
    .filter((item) => item.text);
}

async function lookupHadeethEnc(id: string): Promise<HadithVerification[]> {
  const payload = await requestJson<{
    id?: string;
    hadeeth?: string;
    grade?: string;
    attribution?: string;
    reference?: string;
  }>(`https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${encodeURIComponent(id)}`);
  if (!payload.hadeeth) return [];
  return [{
    text: payload.hadeeth,
    grade: payload.grade,
    source: payload.attribution,
    takhrij: payload.reference,
  }];
}

export async function verifyHadith(query: string): Promise<HadithVerification[]> {
  const normalized = query.trim();
  if (normalized.length < 4) return [];
  try {
    const dorar = await searchDorar(normalized);
    if (dorar.length) return dorar;
  } catch (error) {
    console.warn("[nour:api:fallback] Dorar verification failed", error);
  }
  if (/^\d+$/.test(normalized)) {
    try {
      const hadeethEnc = await lookupHadeethEnc(normalized);
      if (hadeethEnc.length) return hadeethEnc;
    } catch (error) {
      console.warn("[nour:api:fallback] HadeethEnc lookup failed", error);
    }
  }
  return searchUmmahHadith(normalized);
}

export const fallbackPrayerTimes: PrayerTimes = {
  Fajr: "04:24",
  Sunrise: "06:06",
  Dhuhr: "13:02",
  Asr: "16:38",
  Maghrib: "19:56",
  Isha: "21:26",
};

import { getCachedJson, setCachedJson } from './storage';
import { normalizeArabic } from './local-quran';

export type Hadith = { hadithnumber?: number; arabicnumber?: string; text: string; grades?: { grade: string }[] };

function repairMojibake(value: string) {
  if (!/[ØÙÃÂ]/.test(value)) return value;
  try {
    const bytes = new Uint8Array(
      Array.from(value, (character) => character.charCodeAt(0) & 0xff),
    );
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
}

function parseHadith(item: Record<string, unknown>) {
  const candidate =
    item.text ?? item.hadith_arabic ?? item.arabic ?? item.hadith ?? item.hadeeth;
  const text = repairMojibake(String(candidate ?? "")).trim();
  if (!text) return null;
  const rawGrades = Array.isArray(item.grades) ? item.grades : [];
  const grades = rawGrades.flatMap((grade) => {
    const value = typeof grade === "string" ? grade : (grade as { grade?: unknown })?.grade;
    return value ? [{ grade: repairMojibake(String(value)) }] : [];
  });
  return {
    hadithnumber: Number(item.hadithnumber) || undefined,
    arabicnumber: item.arabicnumber ? String(item.arabicnumber) : undefined,
    text,
    grades,
  } satisfies Hadith;
}

/**
 * Normalise the raw API response into a flat array of raw hadith objects.
 * The fawazahmed0 API uses several structures depending on the edition:
 *   1. A bare array:                     [{...}, {...}]
 *   2. { hadiths: [{...}, {...}] }       (array value)
 *   3. { hadiths: { "1": {...}, "2": {...} } }  (object with numeric keys — Sahih Muslim etc.)
 *   4. { data: [{...}] }                (some mirrors)
 */
function extractItems(data: unknown): Record<string, unknown>[] {
  // Case 1: bare array
  if (Array.isArray(data)) return data as Record<string, unknown>[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Case 2 & 3: { hadiths: array | object }
    const raw = obj.hadiths ?? obj.data ?? obj.ahadith;
    if (raw) {
      if (Array.isArray(raw)) return raw as Record<string, unknown>[];
      // Case 3: object with numeric/string keys
      if (typeof raw === "object") {
        return Object.values(raw as Record<string, unknown>) as Record<string, unknown>[];
      }
    }

    // Case 4: the whole object might be a map of hadiths by number
    const topValues = Object.values(obj);
    if (
      topValues.length > 0 &&
      topValues.every((v) => v && typeof v === "object" && !Array.isArray(v))
    ) {
      return topValues as Record<string, unknown>[];
    }
  }

  return [];
}

export async function getHadithBook(edition = 'ara-bukhari') {
  const key = `hadith:v3:${edition}`;
  const cached = await getCachedJson<Hadith[]>(key);
  if (cached) return cached;

  const controller = new AbortController();
  // Large books (e.g. Sahih Muslim ~7 500 hadiths) can take a while on slow
  // connections.  Give them 30 seconds before giving up.
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let data: unknown;
  try {
    const response = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}.json`,
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error('تعذر تحميل كتاب الحديث');
    data = await response.json();
  } finally {
    clearTimeout(timeout);
  }

  const items = extractItems(data);
  if (!items.length) {
    console.warn('[nour:hadith] No items extracted for edition', edition, typeof data, Object.keys(data as object).slice(0, 5));
    throw new Error('وصلت استجابة فارغة من مصدر الحديث. تحقق من الاتصال وحاول مجدداً.');
  }

  const hadiths = items.flatMap((item) => {
    const parsed = parseHadith(item);
    return parsed ? [parsed] : [];
  });

  if (!hadiths.length) {
    throw new Error('لم يُتعرَّف على تنسيق الكتاب. سيُحاول نور مجدداً في المرة القادمة.');
  }

  await setCachedJson(key, hadiths);
  return hadiths;
}

/**
 * Search hadiths by substring match (case-insensitive, diacritic-insensitive).
 * Returns all hadiths when query is blank so the list stays visible.
 * A single Arabic word is sufficient — no minimum length is enforced.
 */
export function searchHadiths(hadiths: Hadith[], query: string) {
  const normalized = normalizeArabic(query.trim());
  if (!normalized) return hadiths;
  return hadiths.filter((hadith) => normalizeArabic(hadith.text).includes(normalized));
}

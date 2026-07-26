import { getCachedJson, setCachedJson } from './storage';

export type QuranAyah = { numberInSurah: number; text: string; audio?: string };
export type QuranSurah = { number: number; name: string; englishName: string; ayahs: QuranAyah[] };

export async function getSurah(number: number): Promise<QuranSurah> {
  const key = `quran:surah:${number}`;
  const cached = await getCachedJson<QuranSurah>(key);
  if (cached) return cached;
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,ar.alafasy`);
  if (!response.ok) throw new Error('تعذر تحميل السورة');
  const raw = (await response.json()) as { data: Array<{ number: number; name: string; englishName: string; ayahs: Array<{ numberInSurah: number; text: string; audio?: string }> }> };
  const textEdition = raw.data[0];
  const audioEdition = raw.data[1];
  const surah: QuranSurah = {
    number: textEdition.number,
    name: textEdition.name,
    englishName: textEdition.englishName,
    ayahs: textEdition.ayahs.map((ayah, index) => ({ ...ayah, audio: audioEdition?.ayahs[index]?.audio })),
  };
  await setCachedJson(key, surah);
  return surah;
}

export async function searchQuran(keyword: string) {
  const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(keyword)}/all/quran-uthmani`);
  if (!response.ok) throw new Error('تعذر تنفيذ البحث');
  const raw = (await response.json()) as { data: { matches: Array<{ text: string; surah: { name: string }; numberInSurah: number }> } };
  return raw.data.matches.slice(0, 12);
}

export async function getTafsir(surah: number, ayah: number) {
  const key = `tafsir:muyassar:${surah}:${ayah}`;
  const cached = await getCachedJson<string>(key);
  if (cached) return cached;
  const response = await fetch(`https://quranenc.com/api/v1/translation/aya/arabic_moyassar/${surah}/${ayah}`);
  if (!response.ok) throw new Error('تعذر تحميل التفسير');
  const raw = (await response.json()) as { result?: unknown };
  const result = Array.isArray(raw.result) ? raw.result[0] : raw.result;
  const value = result as { translation?: string; text?: string; arabic_text?: string } | undefined;
  const tafsir = value?.translation || value?.text || value?.arabic_text;
  if (!tafsir) throw new Error('صيغة تفسير غير متوقعة');
  await setCachedJson(key, tafsir);
  return tafsir;
}

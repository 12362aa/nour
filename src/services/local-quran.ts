import * as SQLite from "expo-sqlite";

type BundledAyah = {
  number: number;
  numberInSurah: number;
  text: string;
};

type BundledSurah = {
  number: number;
  name: string;
  englishName: string;
  ayahs: BundledAyah[];
};

type BundledQuran = {
  data: { surahs: BundledSurah[] };
};

const bundled = require("../../assets/data/quran-uthmani.json") as BundledQuran;
const DATABASE_NAME = "nour-quran.db";
const EXPECTED_AYAHS = 6236;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let readyPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function normalizeArabic(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function openDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
}

async function ensureQuranIndex() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const database = await openDatabase();
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS quran_ayahs (
        id INTEGER PRIMARY KEY NOT NULL,
        surah_number INTEGER NOT NULL,
        surah_name TEXT NOT NULL,
        ayah_number INTEGER NOT NULL,
        text TEXT NOT NULL,
        normalized_text TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS quran_ayahs_surah_idx
      ON quran_ayahs (surah_number, ayah_number);
    `);
    const row = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM quran_ayahs",
    );
    if (row?.count === EXPECTED_AYAHS) return database;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync("DELETE FROM quran_ayahs");
      const statement = await transaction.prepareAsync(
        "INSERT INTO quran_ayahs (id, surah_number, surah_name, ayah_number, text, normalized_text) VALUES (?, ?, ?, ?, ?, ?)",
      );
      try {
        for (const surah of bundled.data.surahs) {
          for (const ayah of surah.ayahs) {
            await statement.executeAsync([
              ayah.number,
              surah.number,
              surah.name,
              ayah.numberInSurah,
              ayah.text,
              normalizeArabic(ayah.text),
            ]);
          }
        }
      } finally {
        await statement.finalizeAsync();
      }
    });
    return database;
  })().catch((error) => {
    readyPromise = null;
    throw error;
  });
  return readyPromise;
}

export function getBundledSurah(number: number) {
  const surah = bundled.data.surahs.find((item) => item.number === number);
  if (!surah) throw new Error("رقم السورة غير صحيح");
  return {
    number: surah.number,
    name: surah.name,
    englishName: surah.englishName,
    verses: surah.ayahs.map((ayah) => ({
      number: ayah.numberInSurah,
      text: ayah.text,
      audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`,
    })),
  };
}

export async function searchBundledQuran(query: string) {
  const normalized = normalizeArabic(query);
  if (normalized.length < 2) return [];
  const database = await ensureQuranIndex();
  return database.getAllAsync<{
    text: string;
    surah: string;
    verse: number;
    surahNumber: number;
  }>(
    `SELECT text, surah_name AS surah, ayah_number AS verse,
            surah_number AS surahNumber
       FROM quran_ayahs
      WHERE normalized_text LIKE ?
      ORDER BY surah_number, ayah_number
      LIMIT 40`,
    `%${normalized}%`,
  );
}

export function warmQuranIndex() {
  return ensureQuranIndex().then(() => undefined);
}

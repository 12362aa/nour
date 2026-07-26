import AsyncStorage from "@react-native-async-storage/async-storage";

export type KhatmaUnit = "pages" | "juz" | "hizb";

export type KhatmaConfig = {
  active: boolean;
  targetDays: number; // e.g. 30, 60
  unit: KhatmaUnit;
  preferredTime?: string; // e.g. "09:00"
  startDate: string; // "YYYY-MM-DD"
  completedPages: number; // 0 to 604
  streak: number;
  lastReadDate?: string;
};

const KHATMA_STORAGE_KEY = "nour:khatma:v1";

export const TOTAL_QURAN_PAGES = 604;
export const TOTAL_JUZ = 30;
export const TOTAL_HIZB = 60;

export async function loadKhatmaConfig(): Promise<KhatmaConfig> {
  try {
    const raw = await AsyncStorage.getItem(KHATMA_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.warn("[nour:khatma] Failed to load khatma config", error);
  }
  return {
    active: false,
    targetDays: 30,
    unit: "pages",
    preferredTime: "09:00",
    startDate: new Date().toISOString().split("T")[0],
    completedPages: 0,
    streak: 0,
  };
}

export async function saveKhatmaConfig(config: KhatmaConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(KHATMA_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn("[nour:khatma] Failed to save khatma config", error);
  }
}

export function getDailyPagesGoal(targetDays: number): number {
  return Math.ceil(TOTAL_QURAN_PAGES / Math.max(1, targetDays));
}

export function getKhatmaProgressPercent(completedPages: number): number {
  return Math.min(100, Math.round((completedPages / TOTAL_QURAN_PAGES) * 100));
}

export function getTargetTextByUnit(pages: number, unit: KhatmaUnit): string {
  if (unit === "juz") {
    const juzCount = (pages / 20).toFixed(1);
    return `${juzCount} جزء تقريباً (${pages} صفحة)`;
  }
  if (unit === "hizb") {
    const hizbCount = (pages / 10).toFixed(1);
    return `${hizbCount} حزب تقريباً (${pages} صفحة)`;
  }
  return `${pages} صفحة يومياً`;
}

export type MilestoneBadge = {
  id: string;
  title: string;
  description: string;
  iconKey: "sprout" | "book" | "sparkles" | "moon" | "award" | "crown";
  gradient: [string, string];
  unlocked: boolean;
};

export function getKhatmaBadges(completedPages: number): MilestoneBadge[] {
  return [
    {
      id: "first_day",
      title: "أول ورد",
      description: "بدأت رحلة الختمة المباركة مع نور",
      iconKey: "sprout",
      gradient: ["#10B981", "#059669"],
      unlocked: completedPages > 0,
    },
    {
      id: "first_juz",
      title: "الجزء الأول",
      description: "أتممت قراءة أول جزء من المصحف",
      iconKey: "book",
      gradient: ["#14B8A6", "#0D9488"],
      unlocked: completedPages >= 20,
    },
    {
      id: "quarter",
      title: "ربع القرآن",
      description: "وصلت إلى ربع كتاب الله (151 صفحة)",
      iconKey: "sparkles",
      gradient: ["#F59E0B", "#D97706"],
      unlocked: completedPages >= 151,
    },
    {
      id: "half",
      title: "نصف القرآن",
      description: "أنجزت نصف القرآن الكريم (302 صفحة)",
      iconKey: "moon",
      gradient: ["#6366F1", "#4F46E5"],
      unlocked: completedPages >= 302,
    },
    {
      id: "three_quarters",
      title: "ثلاثة أرباع القرآن",
      description: "أنجزت ثلاثة أرباع القرآن (453 صفحة)",
      iconKey: "award",
      gradient: ["#8B5CF6", "#7C3AED"],
      unlocked: completedPages >= 453,
    },
    {
      id: "completed",
      title: "الختمة الكبرى",
      description: "ختمت القرآن الكريم كاملاً بفضل الله!",
      iconKey: "crown",
      gradient: ["#D97706", "#B45309"],
      unlocked: completedPages >= TOTAL_QURAN_PAGES,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*                        Daily Seeded Ayah & Dhikr                           */
/* -------------------------------------------------------------------------- */

export type AyahOfTheDay = {
  surahName: string;
  surahNumber: number;
  verseNumber: number;
  text: string;
};

export type DhikrOfTheDay = {
  text: string;
  source: string;
};

const DAILY_AYAT: AyahOfTheDay[] = [
  {
    surahName: "البقرة",
    surahNumber: 2,
    verseNumber: 152,
    text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
  },
  {
    surahName: "البقرة",
    surahNumber: 2,
    verseNumber: 286,
    text: "رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا",
  },
  {
    surahName: "آل عمران",
    surahNumber: 3,
    verseNumber: 139,
    text: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ",
  },
  {
    surahName: "آل عمران",
    surahNumber: 3,
    verseNumber: 173,
    text: "الَّذِينَ قَالَ لَهُمُ النَّاسُ إِنَّ النَّاسَ قَدْ جَمَعُوا لَكُمْ فَاخْشَوْهُمْ فَزَادَهُمْ إِيمَانًا وَقَالُوا حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
  },
  {
    surahName: "الشرح",
    surahNumber: 94,
    verseNumber: 5,
    text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا",
  },
  {
    surahName: "الضحى",
    surahNumber: 93,
    verseNumber: 5,
    text: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
  },
  {
    surahName: "إبراهيم",
    surahNumber: 14,
    verseNumber: 7,
    text: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
  },
  {
    surahName: "الرعد",
    surahNumber: 13,
    verseNumber: 28,
    text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
  },
  {
    surahName: "الطلاق",
    surahNumber: 65,
    verseNumber: 3,
    text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ",
  },
];

const DAILY_AZKAR: DhikrOfTheDay[] = [
  {
    text: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    source: "حديث صحيح — سنن أبي داود",
  },
  {
    text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
    source: "أذكار الصباح والمساء",
  },
  {
    text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
    source: "دعاء كرب ومناجاة",
  },
  {
    text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
    source: "حديث جويرية أم المؤمنين — صحيح مسلم",
  },
  {
    text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
    source: "دعاء العافية المستجاب",
  },
];

export function getAyahOfTheDay(date: Date = new Date()): AyahOfTheDay {
  const seed = date.getFullYear() * 1000 + (date.getMonth() + 1) * 31 + date.getDate();
  const index = Math.abs(seed) % DAILY_AYAT.length;
  return DAILY_AYAT[index];
}

export function getDhikrOfTheDay(date: Date = new Date()): DhikrOfTheDay {
  const seed = date.getFullYear() * 1000 + (date.getMonth() + 1) * 31 + date.getDate();
  const index = Math.abs(seed) % DAILY_AZKAR.length;
  return DAILY_AZKAR[index];
}

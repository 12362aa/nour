import AsyncStorage from "@react-native-async-storage/async-storage";

export type PrayerKey = "Fajr" | "Duha" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export type DailyPrayerRecord = {
  Fajr?: boolean;
  Duha?: boolean;
  Dhuhr?: boolean;
  Asr?: boolean;
  Maghrib?: boolean;
  Isha?: boolean;
};

export type TrackerData = {
  prayers: Record<string, DailyPrayerRecord>; // "YYYY-MM-DD" -> Record
  fasting: Record<string, boolean>; // "YYYY-MM-DD" -> boolean
};

const TRACKER_STORAGE_KEY = "nour:tracker:v1";

export function getFormattedDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function loadTrackerData(): Promise<TrackerData> {
  try {
    const raw = await AsyncStorage.getItem(TRACKER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        prayers: parsed.prayers || {},
        fasting: parsed.fasting || {},
      };
    }
  } catch (error) {
    console.warn("[nour:tracker] Failed to load tracker data", error);
  }
  return { prayers: {}, fasting: {} };
}

export async function saveTrackerData(data: TrackerData): Promise<void> {
  try {
    await AsyncStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("[nour:tracker] Failed to save tracker data", error);
  }
}

/** Check if all 5 mandatory prayers were completed for a given day record */
export function isDayPrayerComplete(record?: DailyPrayerRecord): boolean {
  if (!record) return false;
  return Boolean(
    record.Fajr && record.Dhuhr && record.Asr && record.Maghrib && record.Isha
  );
}

/** Calculate consecutive days streak for 5 mandatory prayers */
export function calculatePrayerStreak(prayers: Record<string, DailyPrayerRecord>): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayKey = getFormattedDateKey(today);
  const todayComplete = isDayPrayerComplete(prayers[todayKey]);

  let checkDate = new Date(today);
  
  if (todayComplete) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // If today is not complete yet, start checking from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = getFormattedDateKey(checkDate);
    const complete = isDayPrayerComplete(prayers[key]);
    if (complete) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** Calculate consecutive days streak for fasting */
export function calculateFastingStreak(fasting: Record<string, boolean>): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayKey = getFormattedDateKey(today);
  const todayFasted = fasting[todayKey] === true;

  let checkDate = new Date(today);

  if (todayFasted) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = getFormattedDateKey(checkDate);
    if (fasting[key] === true) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** Check if a given date is a recommended fast day (Monday/Thursday, White Days 13,14,15, Ramadan) */
export function getFastDayInfo(date: Date, hijriDay?: number, hijriMonth?: number): { isRecommended: boolean; reason?: string } {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, 4 = Thursday

  if (hijriMonth === 9) {
    return { isRecommended: true, reason: "شهر رمضان المبارك (فرض)" };
  }
  if (hijriDay === 13 || hijriDay === 14 || hijriDay === 15) {
    return { isRecommended: true, reason: `الأيام البيض (${hijriDay} هجرياً)` };
  }
  if (dayOfWeek === 1) {
    return { isRecommended: true, reason: "صيام سنة (يوم الاثنين)" };
  }
  if (dayOfWeek === 4) {
    return { isRecommended: true, reason: "صيام سنة (يوم الخميس)" };
  }

  return { isRecommended: false };
}

export function calculateBestPrayerStreak(prayers: Record<string, DailyPrayerRecord>): number {
  let maxStreak = 0;
  let currentStreak = 0;
  
  const dates = Object.keys(prayers).sort((a, b) => a.localeCompare(b));
  if (dates.length === 0) return 0;
  
  let prevDate: Date | null = null;
  
  for (const dateKey of dates) {
    if (isDayPrayerComplete(prayers[dateKey])) {
      const currDate = new Date(dateKey);
      if (prevDate) {
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = currDate;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }
  }
  return Math.max(maxStreak, calculatePrayerStreak(prayers));
}

export function calculateBestFastingStreak(fasting: Record<string, boolean>): number {
  let maxStreak = 0;
  let currentStreak = 0;
  
  const dates = Object.keys(fasting).sort((a, b) => a.localeCompare(b));
  if (dates.length === 0) return 0;
  
  let prevDate: Date | null = null;
  
  for (const dateKey of dates) {
    if (fasting[dateKey] === true) {
      const currDate = new Date(dateKey);
      if (prevDate) {
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = currDate;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }
  }
  return Math.max(maxStreak, calculateFastingStreak(fasting));
}

export function calculateWeeklyPrayersCount(prayers: Record<string, DailyPrayerRecord>): number {
  let count = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getFormattedDateKey(d);
    const record = prayers[key];
    if (record) {
      if (record.Fajr) count++;
      if (record.Dhuhr) count++;
      if (record.Asr) count++;
      if (record.Maghrib) count++;
      if (record.Isha) count++;
    }
  }
  return count;
}

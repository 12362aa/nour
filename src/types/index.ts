export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerTiming = {
  name: PrayerName;
  arabic: string;
  time: string;
  icon: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
  city: string;
};

export type PrayerStatus = 'onTime' | 'mosque' | 'late' | 'missed';

export type PrayerLog = Record<string, Partial<Record<PrayerName, PrayerStatus>>>;

export type Dhikr = {
  id: string;
  text: string;
  count: number;
  source?: string;
};

export type DhikrSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  items: Dhikr[];
};

import { create } from "zustand";
import { Coordinates, PrayerLog, PrayerName, PrayerStatus } from "../types";
import { loadSettings, saveSettings } from "../services/storage";
import { DEFAULT_REMINDERS, ReminderSettings } from "../services/notifications";

export type LocalProfile = {
  name: string;
  email: string;
  joinedAt: string;
  avatarUri?: string;
};

type NourState = {
  favoriteNames: number[];
  toggleFavoriteName: (id: number) => void;
  method: number;
  coordinates: Coordinates;
  locationReady: boolean;
  muteToday: boolean;
  tasbeeh: number;
  prayerLog: PrayerLog;
  lastAyah: string;
  khatmaGoal: number;
  khatmaProgress: number;
  reminders: ReminderSettings;
  profile: LocalProfile | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMethod: (method: number) => void;
  setCoordinates: (coordinates: Coordinates) => void;
  useDefaultLocation: () => void;
  setMuteToday: (value: boolean) => void;
  incrementTasbeeh: () => void;
  resetTasbeeh: () => void;
  setPrayerStatus: (
    date: string,
    prayer: PrayerName,
    status: PrayerStatus,
  ) => void;
  setLastAyah: (ayah: string) => void;
  setKhatmaProgress: (value: number) => void;
  setReminder: (key: keyof ReminderSettings, value: boolean) => void;
  setProfile: (profile: LocalProfile | null) => void;
};

type Persisted = Pick<
  NourState,
  | "method"
  | "coordinates"
  | "locationReady"
  | "muteToday"
  | "tasbeeh"
  | "prayerLog"
  | "lastAyah"
  | "khatmaGoal"
  | "khatmaProgress"
  | "reminders"
  | "profile"
  | "favoriteNames"
>;

const DEFAULTS: Persisted = {
  method: 5,
  coordinates: { latitude: 30.0444, longitude: 31.2357, city: "القاهرة" },
  locationReady: false,
  muteToday: false,
  tasbeeh: 0,
  prayerLog: {},
  lastAyah: "الفاتحة · الآية ١",
  khatmaGoal: 30,
  khatmaProgress: 0,
  reminders: DEFAULT_REMINDERS,
  profile: null,
  favoriteNames: [],
};

const persist = (state: NourState) => {
  const {
    hydrated,
    hydrate,
    setMethod,
    setCoordinates,
    useDefaultLocation,
    setMuteToday,
    incrementTasbeeh,
    resetTasbeeh,
    setPrayerStatus,
    setLastAyah,
    setKhatmaProgress,
    setReminder,
    setProfile,
    favoriteNames,
    toggleFavoriteName,
    ...saved
  } = state;
  return saveSettings(saved);
};

export const useNourStore = create<NourState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: async () => {
    const saved = await loadSettings<Partial<Persisted>>();
    set({ ...DEFAULTS, ...saved, hydrated: true });
  },
  setMethod: (method) => {
    set({ method });
    void persist(get());
  },
  setCoordinates: (coordinates) => {
    set({ coordinates, locationReady: true });
    void persist(get());
  },
  useDefaultLocation: () => {
    set({ coordinates: DEFAULTS.coordinates, locationReady: true });
    void persist(get());
  },
  setMuteToday: (muteToday) => {
    set({ muteToday });
    void persist(get());
  },
  incrementTasbeeh: () => {
    set((state) => ({ tasbeeh: state.tasbeeh + 1 }));
    void persist(get());
  },
  resetTasbeeh: () => {
    set({ tasbeeh: 0 });
    void persist(get());
  },
  setPrayerStatus: (date, prayer, status) => {
    set((state) => ({
      prayerLog: {
        ...state.prayerLog,
        [date]: { ...state.prayerLog[date], [prayer]: status },
      },
    }));
    void persist(get());
  },
  setLastAyah: (lastAyah) => {
    set({ lastAyah });
    void persist(get());
  },
  setKhatmaProgress: (khatmaProgress) => {
    set({ khatmaProgress });
    void persist(get());
  },
  setReminder: (key, value) => {
    set((state) => ({ reminders: { ...state.reminders, [key]: value } }));
    void persist(get());
  },
  toggleFavoriteName: (id) => {
    set((state) => {
      const exists = state.favoriteNames.includes(id);
      return {
        favoriteNames: exists
          ? state.favoriteNames.filter((x) => x !== id)
          : [...state.favoriteNames, id],
      };
    });
    void persist(get());
  },
  setProfile: (profile) => {
    set({ profile });
    void persist(get());
  },
}));

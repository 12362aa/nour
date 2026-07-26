import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PrayerAlertKey =
  | "Fajr"
  | "Sunrise"
  | "Dhuhr"
  | "Asr"
  | "Maghrib"
  | "Isha";

export type PrayerAlertSettings = Record<PrayerAlertKey, boolean>;

export const DEFAULT_PRAYER_ALERTS: PrayerAlertSettings = {
  Fajr: true,
  Sunrise: true,
  Dhuhr: true,
  Asr: true,
  Maghrib: true,
  Isha: true,
};

const PREFERENCES_KEY = "nour:preferences:v1";

type ThemeColors = {
  background: string;
  surface: string;
  surfaceSoft: string;
  ink: string;
  muted: string;
  border: string;
  primary: string;
  gold: string;
  onPrimary: string;
  selectedSurface: string;
  selectedText: string;
};

type NourThemeValue = {
  ready: boolean;
  darkMode: boolean;
  prayerAlerts: PrayerAlertSettings;
  colors: ThemeColors;
  setDarkMode: (value: boolean) => void;
  setPrayerAlert: (key: PrayerAlertKey, value: boolean) => void;
};

const lightColors: ThemeColors = {
  background: "#FAF8F3",
  surface: "#FFFFFF",
  surfaceSoft: "#F7F2E7",
  ink: "#2B2B2B",
  muted: "#70716D",
  border: "#EDE7D9",
  primary: "#315B4C",
  gold: "#C9A24B",
  onPrimary: "#FFFFFF",
  selectedSurface: "#F4E6C2",
  selectedText: "#2B2B2B",
};

const darkColors: ThemeColors = {
  background: "#111916",
  surface: "#1C2925",
  surfaceSoft: "#243630",
  ink: "#F8F4E9",
  muted: "#B7C0BA",
  border: "#33453F",
  primary: "#8EC5AE",
  gold: "#E2BD64",
  onPrimary: "#FFFFFF",
  selectedSurface: "#59491F",
  selectedText: "#FFF9E8",
};

const NourThemeContext = createContext<NourThemeValue>({
  ready: false,
  darkMode: false,
  prayerAlerts: DEFAULT_PRAYER_ALERTS,
  colors: lightColors,
  setDarkMode: () => undefined,
  setPrayerAlert: () => undefined,
});

type StoredPreferences = {
  darkMode?: boolean;
  prayerAlerts?: Partial<PrayerAlertSettings>;
};

export function NourThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [darkMode, setDarkModeState] = useState(false);
  const [prayerAlerts, setPrayerAlerts] = useState(DEFAULT_PRAYER_ALERTS);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PREFERENCES_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const stored = JSON.parse(raw) as StoredPreferences;
        setDarkModeState(Boolean(stored.darkMode));
        setPrayerAlerts({
          ...DEFAULT_PRAYER_ALERTS,
          ...stored.prayerAlerts,
        });
      })
      .catch((error) =>
        console.warn("[nour:preferences] read failed", error),
      )
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ darkMode, prayerAlerts }),
    ).catch((error) => console.warn("[nour:preferences] save failed", error));
  }, [darkMode, prayerAlerts, ready]);

  const value = useMemo<NourThemeValue>(
    () => ({
      ready,
      darkMode,
      prayerAlerts,
      colors: darkMode ? darkColors : lightColors,
      setDarkMode: setDarkModeState,
      setPrayerAlert: (key, enabled) =>
        setPrayerAlerts((current) => ({ ...current, [key]: enabled })),
    }),
    [darkMode, prayerAlerts, ready],
  );

  return (
    <NourThemeContext.Provider value={value}>
      {children}
    </NourThemeContext.Provider>
  );
}

export function useNourTheme() {
  return useContext(NourThemeContext);
}

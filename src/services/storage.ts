import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "nour:settings";
const CONTENT_PREFIX = "nour:content:";

/**
 * The content cache is intentionally JSON-on-device: it stores the complete
 * downloaded azkar corpus and successful API responses once, then serves them
 * offline on subsequent opens. AsyncStorage is available on Android, iOS, and
 * the web preview used for visual QA.
 */
export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(`${CONTENT_PREFIX}${key}`);
    return json ? (JSON.parse(json) as T) : null;
  } catch (error) {
    console.warn("[nour:storage] cache read failed", { key, error });
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(`${CONTENT_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    // Caching must never prevent the live response from being shown.
    console.warn("[nour:storage] cache write failed", { key, error });
  }
}

export async function loadSettings<T>(): Promise<T | null> {
  const json = await AsyncStorage.getItem(SETTINGS_KEY);
  return json ? (JSON.parse(json) as T) : null;
}

export async function saveSettings(value: unknown) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
}

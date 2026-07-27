import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { PrayerTiming } from "../types";
import { createZonedTarget } from "./timeService";
import {
  clearNativeScheduledAlerts,
  getNativeScheduledSummary,
} from "./fullScreenNotifications";

// ── Channel IDs (immutable after first creation on Android) ──────────────────
const ADHAN_CHANNEL = "nour-adhan-v6";
const SILENT_CHANNEL = "nour-silent-v6";
const AZKAR_MORNING_CHANNEL = "nour-azkar-morning-v6";
const AZKAR_EVENING_CHANNEL = "nour-azkar-evening-v6";
const GENERAL_CHANNEL = "nour-reminders-v6";
const KHATMA_CHANNEL = "nour-khatma-v6";
const ADHAN_SOUND = "adhan";
const AZKAR_MORNING_SOUND = "azkar_sobh";
const AZKAR_EVENING_SOUND = "azkar_masaa";
const PRAYER_CATEGORY = "nour-prayer-actions";
const LEGACY_CHANNELS = [
  "nour-khatma-v1-5", "nour-khatma-v2", "nour-khatma-v3",
  "nour-azkar-evening-v1-5", "nour-azkar-evening-v3", "nour-azkar-evening-v4", "nour-azkar-evening-v5",
  "nour-azkar-morning-v1-5", "nour-azkar-morning-v3", "nour-azkar-morning-v4",
  "nour-reminders-v1-5", "nour-reminders-v5",
  "nour-adhan-v1-5", "nour-adhan-v3",
  "nour-silent-v1-5"
];
const LEGACY_CLEANUP_KEY = "nour:notification-legacy-cleanup-v11";

// ── Foreground notification display handler ───────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Channel setup (called once on app start) ──────────────────────────────────
let _channelsPrepared = false;
export async function prepareNotifications(): Promise<void> {
  if (_channelsPrepared) return;
  _channelsPrepared = true;

  if (Platform.OS !== "android") return;

  // Remove legacy channels
  for (const ch of LEGACY_CHANNELS) {
    await Notifications.deleteNotificationChannelAsync(ch).catch(() => null);
  }

  // Adhan channel (loud, custom sound)
  await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL, {
    name: "الاذان والصلاة",
    description: "صوت الاذان عند حلول وقت الصلاة",
    importance: Notifications.AndroidImportance.MAX,
    sound: ADHAN_SOUND,
    vibrationPattern: [0, 400, 200, 400],
    lightColor: "#D7AA4F",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
    enableLights: true,
  }).catch(() => null);

  // Silent channel for muted prayers
  await Notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
    name: "صلاة (كتم الصوت)",
    description: "تنبيه بدون صوت عند اختيار كتم الاذان",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: undefined,
    vibrationPattern: [0, 120],
    lightColor: "#D7AA4F",
  }).catch(() => null);

  // Azkar morning
  await Notifications.setNotificationChannelAsync(AZKAR_MORNING_CHANNEL, {
    name: "اذكار الصباح",
    description: "تذكير اذكار الصباح",
    importance: Notifications.AndroidImportance.HIGH,
    sound: AZKAR_MORNING_SOUND,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: "#D7AA4F",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
  }).catch(() => null);

  // Azkar evening
  await Notifications.setNotificationChannelAsync(AZKAR_EVENING_CHANNEL, {
    name: "اذكار المساء",
    description: "تذكير اذكار المساء",
    importance: Notifications.AndroidImportance.HIGH,
    sound: AZKAR_EVENING_SOUND,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: "#D7AA4F",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
  }).catch(() => null);

  // General reminders (system default sound)
  await Notifications.setNotificationChannelAsync(GENERAL_CHANNEL, {
    name: "التذكيرات العامة",
    description: "تنبيهات للأذكار والورد القرآني والصيام",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 400],
    lightColor: "#D7AA4F",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
  }).catch(() => null);

  // Khatma channel
  await Notifications.setNotificationChannelAsync(KHATMA_CHANNEL, {
    name: "ختمة القرآن",
    description: "تنبيه ورد الختمة اليومي",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 400, 200, 400],
    lightColor: "#10B981",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
  }).catch(() => null);

  // Prayer action buttons
  await Notifications.setNotificationCategoryAsync(PRAYER_CATEGORY, [
    {
      identifier: "mark_prayed",
      buttonTitle: "سجلت الصلاة",
      options: { opensAppToForeground: true },
    },
    {
      identifier: "mute_today",
      buttonTitle: "كتم اليوم",
      options: { opensAppToForeground: true },
    },
  ]);

  // Reminder action categories
  const reminderCategories = [
    { cat: "nour-category-azkar-morning",  id: "read_morning",  label: "ابدأ القراءة" },
    { cat: "nour-category-azkar-evening",  id: "read_evening",  label: "ابدأ القراءة" },
    { cat: "nour-category-friday-kahf",    id: "read_kahf",     label: "اقرأ سورة الكهف" },
    { cat: "nour-category-daily-quran",    id: "open_quran",    label: "اقرأ وردك اليومي" },
    { cat: "nour-category-hadith",         id: "open_hadith",   label: "تصفح المكتبة" },
    { cat: "nour-category-fasting",        id: "open_fasting",  label: "متابعة الصيام" },
    { cat: "nour-category-witr",           id: "open_witr",     label: "قيام الليل والوتر" },
    { cat: "nour-category-salawat",        id: "open_salawat",  label: "صل عليه وسلم" },
    { cat: "nour-category-khatma",         id: "open_khatma",   label: "افتح الختمة" },
  ];
  for (const { cat, id, label } of reminderCategories) {
    await Notifications.setNotificationCategoryAsync(cat, [
      { identifier: id, buttonTitle: label, options: { opensAppToForeground: true } },
    ]);
  }

  // Cancel any old locally-scheduled notifications (one-time cleanup)
  const didCleanup = await AsyncStorage.getItem(LEGACY_CLEANUP_KEY);
  if (!didCleanup) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    await clearNativeScheduledAlerts().catch(() => null);
    await AsyncStorage.setItem(LEGACY_CLEANUP_KEY, new Date().toISOString());
    console.info("[nour:notifications] Legacy local notifications cleared.");
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) await Notifications.requestPermissionsAsync();
}

// ── Channel resolver for incoming FCM notifications ───────────────────────────
export function getChannelForType(type: string): string {
  if (type === "morning") return AZKAR_MORNING_CHANNEL;
  if (type === "evening") return AZKAR_EVENING_CHANNEL;
  if (type === "prayer") return ADHAN_CHANNEL;
  if (type === "khatma") return KHATMA_CHANNEL;
  return GENERAL_CHANNEL;
}

// ── Test helpers (unchanged API, now use FCM-compatible channels) ─────────────
export async function scheduleTestAdhan(secondsFromNow = 10) {
  await prepareNotifications();
  const target = new Date(Date.now() + secondsFromNow * 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: "nour:prayer:test-adhan",
    content: {
      title: "اختبار: حان موعد الصلاة",
      body: "حي على الصلاة، حي على الفلاح. (اشعار تجريبي)",
      sound: ADHAN_SOUND,
      data: { scope: "prayer", prayer: "test", kind: "nour-adhan" },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target, channelId: ADHAN_CHANNEL },
  });
}

export async function scheduleTestReminder(secondsFromNow = 15) {
  await prepareNotifications();
  await Notifications.cancelScheduledNotificationAsync("nour:reminder:test").catch(() => null);
  const target = new Date(Date.now() + secondsFromNow * 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: "nour:reminder:test",
    content: {
      title: "اذكار المساء - نور",
      body: "حان الان موعد اذكار المساء. (اشعار تجريبي)",
      sound: AZKAR_EVENING_SOUND,
      data: { scope: "reminder", targetScreen: "adhkar" },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target, channelId: AZKAR_EVENING_CHANNEL },
  });
}

export async function getScheduledSummary() {
  return Notifications.getAllScheduledNotificationsAsync();
}

export type ScheduledDebugItem = {
  id: string;
  source: "FCM-Backend" | "Local-Test";
  type: string;
  title: string;
  triggerAt: string;
};

export async function getAllScheduledDebugItems(): Promise<ScheduledDebugItem[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const localItems: ScheduledDebugItem[] = scheduled.map((item) => {
    const trigger = item.trigger as { value?: number; date?: number } | null;
    const timestamp = trigger?.value ?? trigger?.date;
    return {
      id: item.identifier,
      source: "Local-Test" as const,
      type: "test",
      title: item.content.title ?? "اشعار تجريبي",
      triggerAt: typeof timestamp === "number"
        ? new Date(timestamp).toISOString()
        : JSON.stringify(item.trigger),
    };
  });
  const nativeItems = await getNativeScheduledSummary();
  return [...localItems, ...nativeItems].sort((a, b) => a.triggerAt.localeCompare(b.triggerAt));
}

// NOTE: rescheduleAllNotifications is kept as a no-op stub so existing call sites
// in NourApp.tsx do not break during the migration. It will be fully removed in a
// follow-up cleanup once FCM is confirmed working.
export function rescheduleAllNotifications(_input: unknown) {
  console.info("[nour:notifications] FCM mode: local scheduling disabled, backend handles delivery.");
  return Promise.resolve({ changed: false, prayerCount: 0, reminderCount: 0, skippedPast: 0 });
}

// requestNotificationReschedule / subscribeNotificationReschedule
// kept as stubs — in FCM mode, prefs are pushed to Supabase by fcm.ts
type ScheduleListener = () => void;
const _listeners = new Set<ScheduleListener>();
export function subscribeNotificationReschedule(listener: ScheduleListener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}
export function requestNotificationReschedule() {
  _listeners.forEach((l) => l());
}

export async function clearAllNourNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await clearNativeScheduledAlerts().catch(() => null);
}

// Khatma reminder now handled by backend. Stub kept for backward compatibility.
export async function scheduleKhatmaReminder(): Promise<void> {
  console.info("[nour:notifications] FCM mode: khatma reminder handled by backend.");
}

export function getNextPrayer(prayers: PrayerTiming[], now = new Date()) {
  for (const prayer of prayers) {
    const target = createZonedTarget(now, prayer.time);
    if (target > now) return { prayer, target };
  }
  const first = prayers[0];
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return {
    prayer: first,
    target: createZonedTarget(tomorrow, first.time),
  };
}

// Re-exports for backward compatibility
export { DEFAULT_REMINDERS } from "./notificationPlan";
export type { ReminderSettings } from "./notificationPlan";

export type NotificationScheduleResult = {
  changed: boolean;
  prayerCount: number;
  reminderCount: number;
  skippedPast: number;
};

/**
 * FCM Service — manages FCM token registration and sync to Supabase.
 * The actual notification scheduling lives entirely on the Backend (Supabase Edge Function).
 * This file handles:
 *  1. Obtaining the FCM device token
 *  2. Syncing user prefs (location, reminders, khatma) to Supabase
 *  3. Handling incoming FCM messages when app is in foreground
 */
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { supabase } from "./auth";
import { ReminderSettings } from "./notificationPlan";
import { KhatmaConfig } from "./khatma";

// Round to 1 decimal place (~11km precision, never exact location)
function roundCoord(val: number): number {
  return Math.round(val * 10) / 10;
}

/**
 * Request permission and get the FCM token for this device.
 * Returns null if permission denied or token unavailable.
 */
export async function getFCMToken(): Promise<string | null> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) return null;

  const token = await messaging().getToken();
  return token ?? null;
}

export type UserPushPrefs = {
  latitude: number;
  longitude: number;
  timezone: string;
  calcMethod: number;
  reminders: ReminderSettings;
  prayerAlerts: Record<string, boolean>;
  muteToday: boolean;
  khatma?: KhatmaConfig | null;
};

/**
 * Register FCM token + sync user prefs to Supabase.
 * Called on: first launch, after login, when prefs change.
 */
export async function syncFCMPrefsToSupabase(prefs: UserPushPrefs): Promise<void> {
  if (!supabase) return;

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return;

  const token = await getFCMToken();

  const row = {
    user_id: user.id,
    fcm_token: token,
    latitude: roundCoord(prefs.latitude),
    longitude: roundCoord(prefs.longitude),
    timezone: prefs.timezone,
    calc_method: prefs.calcMethod,
    // Reminders
    reminder_morning: prefs.reminders.morning,
    reminder_evening: prefs.reminders.evening,
    reminder_daily_quran: prefs.reminders.dailyQuran,
    reminder_hadith: prefs.reminders.hadith,
    reminder_witr: prefs.reminders.witr,
    reminder_friday_kahf: prefs.reminders.fridayKahf,
    reminder_friday_salawat: prefs.reminders.fridaySalawat,
    reminder_fast_days: prefs.reminders.fastDays,
    // Prayer alerts
    prayer_fajr: prefs.prayerAlerts["Fajr"] ?? true,
    prayer_dhuhr: prefs.prayerAlerts["Dhuhr"] ?? true,
    prayer_asr: prefs.prayerAlerts["Asr"] ?? true,
    prayer_maghrib: prefs.prayerAlerts["Maghrib"] ?? true,
    prayer_isha: prefs.prayerAlerts["Isha"] ?? true,
    mute_prayers_today: prefs.muteToday,
    mute_prayers_date: prefs.muteToday ? new Date().toISOString().split("T")[0] : null,
    // Khatma
    khatma_active: prefs.khatma?.active ?? false,
    khatma_completed_pages: prefs.khatma?.completedPages ?? 0,
    khatma_target_days: prefs.khatma?.targetDays ?? 30,
    khatma_start_date: prefs.khatma?.startDate ?? null,
    khatma_last_read_date: prefs.khatma?.lastReadDate ?? null,
    khatma_preferred_time: prefs.khatma?.preferredTime ?? "09:00",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_notification_prefs")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    console.warn("[fcm] Failed to sync prefs to Supabase:", error.message);
  }
}

/**
 * Set up foreground message handler.
 * When app is open and an FCM message arrives, show it via expo-notifications
 * using the correct channel/sound for the notification type.
 */
export function setupFCMForegroundHandler(): () => void {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    const data = remoteMessage.data ?? {};
    const channelId = (data.channelId as string) ?? "nour-reminders-v6";
    const title = remoteMessage.notification?.title ?? (data.title as string | undefined) ?? "";
    const body = remoteMessage.notification?.body ?? (data.body as string | undefined) ?? "";
    const categoryId = data.categoryId as string | undefined;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as Record<string, unknown>,
        categoryIdentifier: categoryId,
        sound: (data.sound as string) === "default" ? true : (data.sound as string) || undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(),
        channelId,
      },
      identifier: (data.notifKey as string) ?? undefined,
    });
  });
  return unsubscribe;
}

/**
 * Handle FCM token refresh — update Supabase when token changes.
 */
export function setupFCMTokenRefreshHandler(
  getLatestPrefs: () => UserPushPrefs | null
): () => void {
  return messaging().onTokenRefresh(async (_newToken) => {
    const prefs = getLatestPrefs();
    if (prefs) {
      await syncFCMPrefsToSupabase(prefs);
    }
  });
}

/**
 * Handle background/quit FCM messages (Android).
 * Must be called outside any React component, at the module level.
 */
export function setupFCMBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // We send data-only messages to trigger this headless task without Android building a default notification.
    // Now we build the notification manually via Expo so we can attach action buttons (categoryId).
    const data = remoteMessage.data ?? {};
    const title = data.title as string | undefined;
    const body = data.body as string | undefined;
    const categoryId = data.categoryId as string | undefined;
    
    if (title || body) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          categoryIdentifier: categoryId,
          sound: data.sound === "default" ? true : (data.sound as string) || undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(),
          channelId: (data.channelId as string) ?? "nour-reminders-v6",
        },
        identifier: data.notifKey as string | undefined,
      });
    }
  });
}

import * as Notifications from "expo-notifications";

export type CentralScheduleContent = Notifications.NotificationContentInput & {
  channelId?: string;
};

/**
 * النقطة المركزية لجدولة كل اشعار في التطبيق.
 * - لا تنشئ قنوات هنا: القنوات تنشا مرة واحدة في prepareNotifications().
 * - الصوت يحدد عبر القناة (channelId) على Android فقط.
 * - تستخدم Expo Notifications حصرا.
 */
export async function scheduleNotification(
  type: string,
  id: string,
  triggerDate: Date,
  content: CentralScheduleContent,
) {
  const secondsUntilTrigger = (triggerDate.getTime() - Date.now()) / 1000;
  if (!Number.isFinite(secondsUntilTrigger) || secondsUntilTrigger <= 2) {
    console.info("[nour:notifications] skipped past trigger", {
      type,
      id,
      triggerDate: triggerDate.toISOString(),
      secondsUntilTrigger,
    });
    return null;
  }

  const { channelId, ...notificationContent } = content;

  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);

  try {
    const result = await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        ...notificationContent,
        data: {
          ...(notificationContent.data ?? {}),
          notificationType: type,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: channelId,
      } as Notifications.DateTriggerInput,
    });
    console.info(`[nour:notifications] scheduled ${type} "${id}" at ${triggerDate.toISOString()}`);
    return result;
  } catch (e) {
    console.error(`[nour:notifications] FAILED to schedule ${type} "${id}"`, e);
    throw e;
  }
}

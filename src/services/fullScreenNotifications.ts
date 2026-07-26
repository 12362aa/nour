/**
 * fullScreenNotifications.ts
 *
 * ãáÇÍÙÉ: Êã ÅáÛÇÁ ÔÇÔÉ ÇáÃĞÇä ÇáÊİÇÚáíÉ (Full-screen overlay) äåÇÆíÇğ.
 * ÇáÃĞÇä ÇáÂä ÅÔÚÇÑ ÚÇÏí ÈÕæÊ ÇáÃĞÇä — ÈÏæä Ãí ÔÇÔÉ ãäÈËŞÉ.
 *
 * åĞÇ Çáãáİ íõÈŞí Úáì ÇáÃäæÇÚ æÇáÏæÇá ÇáÊí ÊÓÊÏÚíåÇ ÃÌÒÇÁ ÃÎÑì ãä ÇáßæÏ
 * ÍÊì áÇ íäßÓÑ Ãí ÇÓÊíÑÇÏ¡ áßä ÈÏæä Ãí ÇÓÊÎÏÇã ÍŞíŞí áÜ Notifee.
 */

export type NativeAlert = { prayer: string; nextPrayer?: string; reminder?: boolean };

/** stub İÇÑÛÉ — áÇ ÊõäİøĞ Ãí ÔíÁ. */
export async function prepareFullScreenAlerts(): Promise<void> {
  return;
}

/** stub İÇÑÛÉ — áÇ ÊæÌÏ ÅÔÚÇÑÇÊ Notifee áãÓÍåÇ. */
export async function clearNativeScheduledAlerts(): Promise<void> {
  return;
}

/** stub — ÊÑÌÚ ãÕİæİÉ İÇÑÛÉ ÏÇÆãÇğ. */
export async function getNativeScheduledSummary(): Promise<any[]> {
  return [];
}

/** stub İÇÑÛÉ — áÇ ÊæÌÏ ÕæÊíÇÊ Notifee áÅíŞÇİåÇ. */
export async function stopNativeAlert(_id?: string): Promise<void> {
  return;
}

/**
 * ÊÍáíá ÈíÇäÇÊ ÅÔÚÇÑ ááÊÍŞŞ ãä ßæäå ÅÔÚÇÑ ÕáÇÉ (adhan).
 * ÊõÓÊÎÏã İí listener ÇáÅÔÚÇÑÇÊ İí NourApp.tsx.
 */
export function alertFromNotification(
  notification: { data?: Record<string, unknown> } | null | undefined,
): NativeAlert | null {
  const data = notification?.data;
  if (!data || data.kind !== "nour-adhan") return null;
  return {
    prayer: String(data.prayer ?? "ÇáÕáÇÉ"),
    nextPrayer: String(data.nextPrayer ?? ""),
    reminder: String(data.reminder) === "true",
  };
}

/** stub İÇÑÛÉ — áÇ íæÌÏ background handler áÜ Notifee. */
export function registerNotifeeBackgroundHandler(): void {
  return;
}

/** stub — áÇ ÊõÓÊÎÏã. */
export async function syncNativePrayerAlerts(_targets: any[]): Promise<void> {
  return;
}

/** stub — áÇ ÊõÓÊÎÏã. */
export async function scheduleNativeAlert(
  _alert: NativeAlert,
  _when: Date,
  _requestedId?: string,
): Promise<string | null> {
  return null;
}

/** stub — áÇ ÊõÓÊÎÏã. */
export async function scheduleTestAdhan(_secondsFromNow = 10): Promise<string | null> {
  return null;
}

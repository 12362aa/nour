import { toDate } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Creates an exact UTC Date object for a given hour and minute on a specific date,
 * strictly interpreted within the provided geographical timezone.
 * 
 * This completely isolates the calculation from the user's phone's timezone setting.
 * For example: if the phone is set to "America/New_York", but the user is in "Africa/Cairo"
 * and we want 18:30 in Cairo, this function ensures we get the UTC timestamp that matches
 * exactly 18:30 in Cairo.
 * 
 * @param date The base date (e.g. today or a future date)
 * @param timeString The time string like "18:30"
 * @param timezone The actual geographical timezone (e.g. "Africa/Cairo"). If omitted, uses device local.
 */
export function createZonedTarget(date: Date, timeString: string, timezone?: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (!timezone) {
    const target = new Date(date);
    target.setHours(hours, minutes, 0, 0);
    return target;
  }

  // Construct an ISO string without the Z, representing the local time in that zone
  // We use date.getFullYear/Month/Date instead of formatting it because Aladhan returns the exact day's gregorian date anyway.
  const isoLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  // Convert that local time + timezone into a universal UTC Date object
  // date-fns-tz handles DST and offset lookups automatically
  const targetUTC = toDate(isoLocal, { timeZone: timezone });
  console.info(`[nour:time] Zone: ${timezone} | Time: ${timeString} | Generated UTC: ${targetUTC.toISOString()} | Phone Local Equivalent: ${targetUTC.toString()}`);
  return targetUTC;
}

/**
 * Normalizes a time string returned by Aladhan (e.g. "15:30 (EET)") to just "15:30"
 */
export function cleanTime(value?: string) {
  return value?.replace(/\s*\(.+?\)/g, "").trim().slice(0, 5) || "00:00";
}

export function formatPrayerTime(time: string, language: "ar" | "en" = "ar") {
  const clean = time.replace(/\s*\(.+?\)/g, "").trim();
  const [rawHour = "0", rawMinute = "00"] = clean.split(":");
  const hour = Math.min(23, Math.max(0, Number(rawHour) || 0));
  const minute = Math.min(59, Math.max(0, Number(rawMinute) || 0));
  const twelveHour = hour % 12 || 12;
  const period = hour >= 12 ? "PM" : "AM";
  return `${String(twelveHour)}:${String(minute).padStart(2, "0")} ${period}`;
}

export function dayNameArabic(date = new Date()) {
  return date.toLocaleDateString('ar-EG', { weekday: 'long' });
}

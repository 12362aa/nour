import {
  buildPrayerTargets,
  buildReminderTargets,
  DEFAULT_REMINDERS,
  isSafelyFuture,
} from "../src/services/notificationPlan";

const now = new Date(2026, 6, 19, 7, 16, 30);
const reminders = buildReminderTargets(DEFAULT_REMINDERS, now);
const prayerDay = {
  date: { gregorian: { date: "19-07-2026" } },
  timings: {
    Fajr: "04:30",
    Sunrise: "06:00",
    Dhuhr: "12:05",
    Asr: "15:35",
    Maghrib: "18:55",
    Isha: "20:25",
  },
};
const prayers = buildPrayerTargets([prayerDay], false, now);
const refreshRuns = Array.from({ length: 5 }, () =>
  buildReminderTargets(DEFAULT_REMINDERS, now)
    .targets.map((item) => item.id)
    .join("|"),
);

if (!reminders.targets.every((item) => isSafelyFuture(item.target, now))) throw new Error("A reminder is not safely in the future");
if (!prayers.targets.every((item) => isSafelyFuture(item.target, now))) throw new Error("A prayer is not safely in the future");
if (new Set(reminders.targets.map((item) => item.id)).size !== reminders.targets.length) throw new Error("Duplicate reminder identifiers");
if (new Set(refreshRuns).size !== 1) throw new Error("The plan changed across five identical refreshes");

console.log(
  JSON.stringify(
    {
      refreshRuns: 5,
      stable: true,
      reminderCount: reminders.targets.length,
      prayerCount: prayers.targets.length,
      skippedPast: reminders.skippedPast + prayers.skippedPast,
      firstReminders: reminders.targets.slice(0, 5).map((item) => ({ id: item.id, at: item.target.toISOString() })),
      prayers: prayers.targets.map((item) => item.id),
    },
    null,
    2,
  ),
);

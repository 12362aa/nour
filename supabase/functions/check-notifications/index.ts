// Supabase Edge Function: check-notifications
// Runs every minute via pg_cron / Supabase Cron Jobs
// Calculates upcoming notifications for all users and sends via FCM
// Deno runtime

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import adhan from "https://esm.sh/adhan@4.4.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID") ?? "nour-app-1ff73";
const FCM_SERVICE_ACCOUNT = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "{}");

// ── Prayer channels mapping ──────────────────────────────────────────────────
const PRAYER_CHANNELS: Record<string, { channel: string; sound: string; arabic: string }> = {
  Fajr:    { channel: "nour-adhan-v6", sound: "adhan", arabic: "الفجر" },
  Dhuhr:   { channel: "nour-adhan-v6", sound: "adhan", arabic: "الظهر" },
  Asr:     { channel: "nour-adhan-v6", sound: "adhan", arabic: "العصر" },
  Maghrib: { channel: "nour-adhan-v6", sound: "adhan", arabic: "المغرب" },
  Isha:    { channel: "nour-adhan-v6", sound: "adhan", arabic: "العشاء" },
};

// ── Reminder definitions (matches notificationPlan.ts) ──────────────────────
type ReminderDef = {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  field: string;
  dayFilter?: number; // 0=Sun,5=Fri
  prevDayFilter?: number; // reminder sent day before (for fasting)
  channel: string;
  sound: string;
  categoryId: string;
};

const REMINDERS: ReminderDef[] = [
  { id: "morning",       title: "صباحك نور",                           body: "ورد أذكار الصباح ينتظرك.",                 hour: 7,  minute: 15, field: "reminder_morning",        channel: "nour-azkar-morning-v6", sound: "azkar_sobh", categoryId: "nour-category-azkar-morning" },
  { id: "quran",         title: "ورد القرآن",                           body: "آية واحدة اليوم قد تصنع فرقا.",             hour: 9,  minute: 0,  field: "reminder_daily_quran",    channel: "nour-reminders-v6",    sound: "default", categoryId: "nour-category-daily-quran" },
  { id: "hadith",        title: "حديث اليوم",                           body: "خصص دقيقة لهدي النبي صلى الله عليه وسلم.", hour: 11, minute: 0,  field: "reminder_hadith",         channel: "nour-reminders-v6",    sound: "default", categoryId: "nour-category-hadith" },
  { id: "evening",       title: "أذكار المساء",                         body: "اطمئن بذكر الله قبل انشغال المساء.",       hour: 18, minute: 0,  field: "reminder_evening",        channel: "nour-azkar-evening-v6", sound: "azkar_masaa", categoryId: "nour-category-azkar-evening" },
  { id: "witr",          title: "لا تنس الوتر",                         body: "اختم يومك بركعة الوتر.",                    hour: 22, minute: 15, field: "reminder_witr",           channel: "nour-reminders-v6",    sound: "default", categoryId: "nour-category-witr" },
  { id: "kahf",          title: "جمعة مباركة - سورة الكهف",            body: "اقرأ سورة الكهف وانر ما بين الجمعتين.",   hour: 8,  minute: 0,  field: "reminder_friday_kahf",    channel: "nour-reminders-v6",    sound: "default", dayFilter: 5, categoryId: "nour-category-friday-kahf" },
  { id: "salawat",       title: "اكثروا من الصلاة على النبي",           body: "من افضل اعمال يوم الجمعة.",                hour: 14, minute: 0,  field: "reminder_friday_salawat", channel: "nour-reminders-v6",    sound: "default", dayFilter: 5, categoryId: "nour-category-salawat" },
  { id: "monday-fast",   title: "تذكير صيام الاثنين",                   body: "هل تنوي صيام غد؟",                          hour: 20, minute: 0,  field: "reminder_fast_days",      channel: "nour-reminders-v6",    sound: "default", prevDayFilter: 0, categoryId: "nour-category-fasting" },
  { id: "thursday-fast", title: "تذكير صيام الخميس",                    body: "هل تنوي صيام غد؟",                          hour: 20, minute: 0,  field: "reminder_fast_days",      channel: "nour-reminders-v6",    sound: "default", prevDayFilter: 4, categoryId: "nour-category-fasting" },
];

// ── FCM token (Google OAuth2) ────────────────────────────────────────────────
let _fcmAccessToken: string | null = null;
let _fcmTokenExpiry = 0;

async function getFCMAccessToken(): Promise<string> {
  const now = Date.now();
  if (_fcmAccessToken && now < _fcmTokenExpiry) return _fcmAccessToken;

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;
  const payload = btoa(JSON.stringify({
    iss: FCM_SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
  }));

  // Sign with RS256 using the private key
  const privateKeyPem = FCM_SERVICE_ACCOUNT.private_key;
  const binaryDer = pemToBinary(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  
  // Base64Url encode the signature
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  const signature = base64Signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  
  const jwt = `${header}.${payload}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  _fcmAccessToken = tokenData.access_token;
  _fcmTokenExpiry = now + (tokenData.expires_in - 60) * 1000;
  return _fcmAccessToken!;
}

function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\\n/g, "").replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ── Send FCM message ─────────────────────────────────────────────────────────
async function sendFCM(
  token: string,
  title: string,
  body: string,
  channelId: string,
  sound: string,
  data: Record<string, string> = {}
): Promise<boolean> {
  const accessToken = await getFCMAccessToken();

  const message = {
    message: {
      token,
      // Data-only message for Android to allow Expo Notifications to build it with action buttons
      data: { ...data, channelId, sound, title, body },
    },
  };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FCM_SERVICE_ACCOUNT.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("FCM send failed: ", err);
    throw new Error(await res.text());
  }
  return true;
}

// ── Prayer time calculation (simplified Adhan algorithm) ─────────────────────
// Uses adhan-js locally
function getCalculationMethod(methodValue: number) {
  switch (methodValue) {
    case 1: return adhan.CalculationMethod.Karachi();
    case 2: return adhan.CalculationMethod.NorthAmerica();
    case 3: return adhan.CalculationMethod.MuslimWorldLeague();
    case 4: return adhan.CalculationMethod.UmmAlQura();
    case 5: return adhan.CalculationMethod.Egyptian();
    case 7: return adhan.CalculationMethod.Tehran();
    case 8: return adhan.CalculationMethod.Dubai();
    case 9: return adhan.CalculationMethod.Kuwait();
    case 10: return adhan.CalculationMethod.Qatar();
    case 11: return adhan.CalculationMethod.MoonsightingCommittee();
    case 12: return adhan.CalculationMethod.Singapore();
    case 13: return adhan.CalculationMethod.Turkey();
    default: return adhan.CalculationMethod.MuslimWorldLeague();
  }
}

async function getPrayerTimesForUser(lat: number, lng: number, method: number, date: Date, tz: string): Promise<Record<string, string> | null> {
  try {
    const coordinates = new adhan.Coordinates(lat, lng);
    const calcMethod = getCalculationMethod(method);
    
    // adhan-js expects the date at noon for accurate calculations
    const dateQuery = new Date(date.getTime());
    dateQuery.setHours(12, 0, 0, 0);

    const prayerTimes = new adhan.PrayerTimes(coordinates, dateQuery, calcMethod);

    const formatTime = (d: Date) => 
      Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

    return {
      Fajr: formatTime(prayerTimes.fajr),
      Dhuhr: formatTime(prayerTimes.dhuhr),
      Asr: formatTime(prayerTimes.asr),
      Maghrib: formatTime(prayerTimes.maghrib),
      Isha: formatTime(prayerTimes.isha),
    };
  } catch (error) {
    console.error("Prayer calc error:", error);
    return null;
  }
}

// ── Smart Khatma notification ────────────────────────────────────────────────
function buildKhatmaNotification(prefs: Record<string, unknown>): { title: string; body: string } {
  const completed = (prefs.khatma_completed_pages as number) ?? 0;
  const targetDays = (prefs.khatma_target_days as number) ?? 30;
  const startDate = prefs.khatma_start_date ? new Date(prefs.khatma_start_date as string) : null;
  const lastRead = prefs.khatma_last_read_date ? new Date(prefs.khatma_last_read_date as string) : null;
  const total = 604;
  const remaining = total - completed;
  const percent = Math.round((completed / total) * 100);

  const now = new Date();
  const daysSinceLastRead = lastRead
    ? Math.floor((now.getTime() - lastRead.getTime()) / 86400000)
    : null;

  const dailyGoal = startDate
    ? Math.ceil(total / targetDays)
    : Math.ceil(total / 30);

  let title = "ورد الختمة";
  let body = "";

  if (daysSinceLastRead !== null && daysSinceLastRead >= 2) {
    title = "الختمة تنتظرك";
    body = `مر ${daysSinceLastRead} أيام دون قراءة. تبقى ${remaining} صفحة لاتمام الختمة.`;
  } else if (remaining <= dailyGoal * 2) {
    title = "اقتربت من ختم القرآن";
    body = `تبقى ${remaining} صفحة فقط لاتمام الختمة. واصل.`;
  } else if (percent === 50) {
    title = "في منتصف الطريق";
    body = `أتممت ${percent}% من الختمة. اقرأ ${dailyGoal} صفحات اليوم لتبقى في الموعد.`;
  } else {
    body = `تبقى ${remaining} صفحة. اقرأ ${dailyGoal} صفحات اليوم لاتمام الختمة في موعدها.`;
  }

  return { title, body };
}

// ── Main handler ─────────────────────────────────────────────────────────────
async function handler(req: Request) {
  // Allow both GET (from pg_net HTTP call) and POST (manual trigger)
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const reqData = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const isTest = reqData.test_mode === true;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Fetch all users with FCM tokens
  const { data: users, error } = await supabase
    .from("user_notification_prefs")
    .select("*")
    .not("fcm_token", "is", null)
    .not("latitude", "is", null);

  if (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!users || users.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  const now = new Date();
  const nowMinute = now.getUTCHours() * 60 + now.getUTCMinutes();
  let totalSent = 0;

  for (const prefs of users) {
    const tz = prefs.timezone ?? "Africa/Cairo";
    // Get current time in user's timezone
    const userNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const userHour = userNow.getHours();
    const userMinute = userNow.getMinutes();
    const userDay = userNow.getDay(); // 0=Sun
    const dateStr = `${userNow.getFullYear()}-${userNow.getMonth() + 1}-${userNow.getDate()}`;

    // Reset mute_prayers_today if date changed
    if (prefs.mute_prayers_today && prefs.mute_prayers_date && prefs.mute_prayers_date !== dateStr) {
      await supabase.from("user_notification_prefs")
        .update({ mute_prayers_today: false, mute_prayers_date: null })
        .eq("user_id", prefs.user_id);
      prefs.mute_prayers_today = false;
    }

    // ── Check reminders ──
    for (const rem of REMINDERS) {
      if (!prefs[rem.field]) continue;
      if (rem.dayFilter !== undefined && userDay !== rem.dayFilter) continue;
      if (rem.prevDayFilter !== undefined) {
        // Send at 20:00 the evening before the fast day
        const tomorrowDay = (userDay + 1) % 7;
        if (tomorrowDay !== rem.prevDayFilter) continue;
      }
      if (isTest) {
          console.log("[fcm] Executing test mode");
          const notifKey = "test::" + Date.now();
          const sent = await sendFCM(prefs.fcm_token, "إشعار تجريبي 🧪", "هذا الإشعار لتأكيد عمل نظام Firebase بنجاح!", "nour-reminders-v5", "default", { type: "test", notifKey });
          if (sent) {
            await supabase.from("notification_send_log").insert({ user_id: prefs.user_id, notification_key: notifKey });
            totalSent++;
          }
          continue;
        }
        if (userHour !== rem.hour || userMinute !== rem.minute) continue;

      const notifKey = `reminder::${rem.id}::${dateStr}`;
      // Check dedup
      const { data: existing } = await supabase
        .from("notification_send_log")
        .select("id")
        .eq("user_id", prefs.user_id)
        .eq("notification_key", notifKey)
        .maybeSingle();
      if (existing) continue;

      const sent = await sendFCM(
        prefs.fcm_token,
        rem.title,
        rem.body,
        rem.channel,
        rem.sound,
        { type: rem.id, notifKey, categoryId: rem.categoryId }
      );
      if (sent) {
        await supabase.from("notification_send_log").insert({ user_id: prefs.user_id, notification_key: notifKey });
        totalSent++;
      }
    }

    // ── Check khatma ──
    if (prefs.khatma_active && prefs.khatma_preferred_time) {
      const [kHour, kMin] = (prefs.khatma_preferred_time as string).split(":").map(Number);
      if (userHour === kHour && userMinute === kMin) {
        const notifKey = `khatma::${dateStr}`;
        const { data: existing } = await supabase
          .from("notification_send_log")
          .select("id")
          .eq("user_id", prefs.user_id)
          .eq("notification_key", notifKey)
          .maybeSingle();
        if (!existing) {
          const { title, body } = buildKhatmaNotification(prefs);
          const sent = await sendFCM(
            prefs.fcm_token,
            title,
            body,
            "nour-khatma-v6",
            "default",
            { type: "khatma", notifKey, categoryId: "nour-category-khatma" }
          );
          if (sent) {
            await supabase.from("notification_send_log").insert({ user_id: prefs.user_id, notification_key: notifKey });
            totalSent++;
          }
        }
      }
    }

    // 🌟 Check prayers 🌟
    if (!prefs.mute_prayers_today) {
      const prayerTimings = await getPrayerTimesForUser(prefs.latitude, prefs.longitude, prefs.calc_method, userNow, tz);
      if (prayerTimings) {
        const prayerFields: Record<string, string> = {
          Fajr: "prayer_fajr", Dhuhr: "prayer_dhuhr",
          Asr: "prayer_asr", Maghrib: "prayer_maghrib", Isha: "prayer_isha",
        };
        for (const [prayer, field] of Object.entries(prayerFields)) {
          if (!prefs[field]) continue;
          const timeStr = prayerTimings[prayer];
          if (!timeStr) continue;
          const [h, minStr] = timeStr.split(":").map(Number);
          if (userHour !== h || userMinute !== minStr) continue;

          const notifKey = `prayer::${prayer}::${dateStr}`;
          const { data: existing } = await supabase
            .from("notification_send_log")
            .select("id")
            .eq("user_id", prefs.user_id)
            .eq("notification_key", notifKey)
            .maybeSingle();
          if (existing) continue;

          const matchedPrayer = PRAYER_CHANNELS[prayer];
          console.log(`[fcm] Sending prayer alert to ${prefs.user_id} for ${matchedPrayer.arabic}`);
          const sent = await sendFCM(
            prefs.fcm_token,
            `حان وقت ${matchedPrayer.arabic}`,
            "حان وقت الصلاة، حي على الصلاة.",
            matchedPrayer.channel,
            matchedPrayer.sound,
            { type: "prayer", prayer, notifKey, categoryId: "nour-prayer-actions" }
          );
          if (sent) {
            await supabase.from("notification_send_log").insert({ user_id: prefs.user_id, notification_key: notifKey });
            totalSent++;
          }
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ processed: users.length, sent: totalSent, timestamp: now.toISOString() }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req: Request) => {
  try {
    return await handler(req);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

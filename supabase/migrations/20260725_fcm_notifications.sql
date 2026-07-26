-- ============================================================
-- Migration: FCM Push Notifications System
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: user_notification_prefs
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token        TEXT,
  latitude         NUMERIC(6,4),
  longitude        NUMERIC(7,4),
  timezone         TEXT NOT NULL DEFAULT 'Africa/Cairo',
  calc_method      INTEGER NOT NULL DEFAULT 5,
  reminder_morning       BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_evening       BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_daily_quran   BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_hadith        BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_witr          BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_friday_kahf   BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_friday_salawat BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_fast_days     BOOLEAN NOT NULL DEFAULT FALSE,
  prayer_fajr      BOOLEAN NOT NULL DEFAULT TRUE,
  prayer_dhuhr     BOOLEAN NOT NULL DEFAULT TRUE,
  prayer_asr       BOOLEAN NOT NULL DEFAULT TRUE,
  prayer_maghrib   BOOLEAN NOT NULL DEFAULT TRUE,
  prayer_isha      BOOLEAN NOT NULL DEFAULT TRUE,
  mute_prayers_today BOOLEAN NOT NULL DEFAULT FALSE,
  mute_prayers_date  DATE,
  khatma_active        BOOLEAN NOT NULL DEFAULT FALSE,
  khatma_completed_pages INTEGER NOT NULL DEFAULT 0,
  khatma_target_days   INTEGER NOT NULL DEFAULT 30,
  khatma_start_date    DATE,
  khatma_last_read_date DATE,
  khatma_preferred_time TEXT DEFAULT '09:00',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own prefs"
  ON public.user_notification_prefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own prefs"
  ON public.user_notification_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prefs"
  ON public.user_notification_prefs FOR UPDATE
  USING (auth.uid() = user_id);

-- Table: notification_send_log (deduplication)
CREATE TABLE IF NOT EXISTS public.notification_send_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_key TEXT NOT NULL,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_log_unique
  ON public.notification_send_log(user_id, notification_key);

-- Cleanup function (called by pg_cron daily)
CREATE OR REPLACE FUNCTION public.cleanup_old_notification_logs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.notification_send_log
  WHERE sent_at < NOW() - INTERVAL '3 days';
END;
$$;

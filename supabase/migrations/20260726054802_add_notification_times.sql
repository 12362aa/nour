
ALTER TABLE public.user_notification_prefs
ADD COLUMN IF NOT EXISTS reminder_morning_time TEXT DEFAULT '07:15',
ADD COLUMN IF NOT EXISTS reminder_evening_time TEXT DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS reminder_quran_time TEXT DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS reminder_hadith_time TEXT DEFAULT '11:00',
ADD COLUMN IF NOT EXISTS reminder_witr_time TEXT DEFAULT '22:15';


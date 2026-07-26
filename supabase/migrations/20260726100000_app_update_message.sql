CREATE TABLE app_update_message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT NOT NULL,
    message TEXT NOT NULL,
    active BOOLEAN DEFAULT false
);

-- Insert a test message for 1.5.1
INSERT INTO app_update_message (version, message, active) 
VALUES ('1.5.1', 'مرحباً بك في الإصدار 1.5.1! لقد قمنا بحل مشكلة الشاشة البيضاء في المكتبة وتحديث شكل التقويم الهجري وتحسينات أخرى هامة.', true);

-- Allow anonymous read access
ALTER TABLE app_update_message ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON app_update_message FOR SELECT USING (true);

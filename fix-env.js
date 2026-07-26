const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');
code = code.replace('Deno.env.get("FCM_SERVICE_ACCOUNT_JSON")', 'Deno.env.get("FCM_SERVICE_ACCOUNT")');
fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);

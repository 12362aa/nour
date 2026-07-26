const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');
code = code.replace(/}\);$/, '}');
fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);

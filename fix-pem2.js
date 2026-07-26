const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');
code = code.replace('.replace(/\\s/g, "");', '.replace(/\\\\n/g, "").replace(/\\s/g, "");');
fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);

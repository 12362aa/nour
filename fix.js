const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');
code = code.replace(/\} \} catch\(e\) \{ return new Response\(JSON\.stringify\(\{ error: e\.message \|\| e\.toString\(\) \}\), \{ status: 500, headers: \{ "Content-Type": "application\/json" \} \}\); \}/g, '}');
code = code.replace(/try \{ const sent = await sendFCM\(prefs\.fcm_token, "ÅÔÚÇÑ ÊÌÑíÈí \?\?", "åĞÇ ÇáÅÔÚÇÑ áÊÃßíÏ Úãá äÙÇã Firebase ÈäÌÇÍ!", "nour-reminders-v5", "default", \{ type: "test", notifKey \}\);/g, 'const sent = await sendFCM(prefs.fcm_token, "ÅÔÚÇÑ ÊÌÑíÈí ??", "åĞÇ ÇáÅÔÚÇÑ áÊÃßíÏ Úãá äÙÇã Firebase ÈäÌÇÍ!", "nour-reminders-v5", "default", { type: "test", notifKey });');
fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);

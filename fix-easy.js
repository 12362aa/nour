const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');

// The file is corrupted at line 226. Let's just restore it from git if we can... wait, it's not tracked.
// I will just read all lines, find the bad lines and remove them!
let lines = code.split('\n');
let newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} catch (e) { return new Response(JSON.stringify({ error: e.message')) continue;
  if (lines[i].includes('Deno.serve(async (req: Request) => { try {')) {
    newLines.push('Deno.serve(async (req: Request) => {');
    continue;
  }
  newLines.push(lines[i]);
}
fs.writeFileSync('supabase/functions/check-notifications/index.ts', newLines.join('\n'));

const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');

// Undo the broken catch
code = code.replace(/\} catch \(e\) \{ return new Response\(JSON\.stringify\(\{ error: e\.message \|\| e\.toString\(\), stack: e\.stack \}\), \{ status: 500, headers: \{ "Content-Type": "application\/json" \} \}\); \}/, '');
code = code.replace('Deno.serve(async (req: Request) => { try {', 'Deno.serve(async (req: Request) => {');

// Properly add global catch
const targetStr = eturn new Response(
    JSON.stringify({ processed: users.length, sent: totalSent, timestamp: now.toISOString() });
const replacement = } catch (e) {
    return new Response(JSON.stringify({ error: e.message || e.toString(), stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  return new Response(
    JSON.stringify({ processed: users.length, sent: totalSent, timestamp: now.toISOString() });
code = code.replace(targetStr, replacement);
code = code.replace('Deno.serve(async (req: Request) => {', 'Deno.serve(async (req: Request) => { try {');

fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);

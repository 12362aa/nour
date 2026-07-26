const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');
code = code.replace('Deno.serve(async (req: Request) => {', 'Deno.serve(async (req: Request) => { try {');
code = code.replace('  return new Response(', '  } catch (e) { return new Response(JSON.stringify({ error: e.message || e.toString(), stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } }); } return new Response(');
fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);

const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');

if (!code.includes('async function handler(req: Request) {')) {
  code = code.replace('Deno.serve(async (req: Request) => {', 'async function handler(req: Request) {');
  code += '\n' + 'Deno.serve(async (req: Request) => {\n' +
    '  try {\n' +
    '    return await handler(req);\n' +
    '  } catch (e) {\n' +
    '    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } });\n' +
    '  }\n' +
    '});\n';
  fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);
}

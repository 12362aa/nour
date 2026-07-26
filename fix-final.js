const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');

// Fix the handler's closing brace (replace '});' with '}' before Deno.serve)
const dserveIndex = code.lastIndexOf('Deno.serve(');
if (dserveIndex > 0) {
    const before = code.substring(0, dserveIndex);
    const after = code.substring(dserveIndex);
    const fixedBefore = before.replace(/  \);\n\}\);\n/g, '  );\n}\n').replace(/  \);\r\n\}\);\r\n/g, '  );\r\n}\r\n');
    code = fixedBefore + after;
}

// Fix the catch block missing parenthesis
code = code.replace(
    /return new Response\(JSON\.stringify\(\{ error: e\.message, stack: e\.stack \}\), \{ status: 500, headers: \{ "Content-Type": "application\/json" \} \}\r?\n  \}/g,
    'return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } });\n  }'
);

fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);

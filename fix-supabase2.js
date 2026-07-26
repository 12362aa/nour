const fs = require('fs');
let code = fs.readFileSync('src/NourApp.tsx', 'utf8');
code = code.replace(/await supabase(\s+)\.from/g, 'await supabase?\.from');
fs.writeFileSync('src/NourApp.tsx', code);

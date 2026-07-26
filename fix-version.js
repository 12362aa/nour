const fs = require('fs');
let code = fs.readFileSync('src/NourApp.tsx', 'utf8');
code = code.replace(/"1\.4"/g, '"1.5.1"').replace(/"1\.5"/g, '"1.5.1"');
fs.writeFileSync('src/NourApp.tsx', code);

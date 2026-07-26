const fs = require('fs');
let code = fs.readFileSync('src/features/RestoredFeatures.tsx', 'utf8');
code = code.replace(/const viewerUrl = https:\/\/docs.google.com\/gview\?embedded=true&url=;/, 'const viewerUrl = "https://docs.google.com/gview?embedded=true&url=";');
fs.writeFileSync('src/features/RestoredFeatures.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/features/RestoredFeatures.tsx', 'utf8');

code = code.replace(/rotate: \deg/, 'rotate: \deg');
code = code.replace(/subtitle=\{„Õ”Ê» »œﬁ… „‰ \}/, 'subtitle={„Õ”Ê» »œﬁ… „‰ \}');
code = code.replace(/rotate: \deg/, 'rotate: \deg');
code = code.replace(/rotate: \deg/, 'rotate: \deg');

fs.writeFileSync('src/features/RestoredFeatures.tsx', code);

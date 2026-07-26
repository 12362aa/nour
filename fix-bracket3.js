const fs = require('fs');
let code = fs.readFileSync('supabase/functions/check-notifications/index.ts', 'utf8');
const lastIndex = code.lastIndexOf('});');
const secondToLast = code.lastIndexOf('});', lastIndex - 1);
if (secondToLast !== -1) {
  code = code.substring(0, secondToLast) + '}' + code.substring(secondToLast + 3);
  fs.writeFileSync('supabase/functions/check-notifications/index.ts', code);
}

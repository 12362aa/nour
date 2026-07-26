const fs = require('fs');
let code = fs.readFileSync('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', 'utf8');
code = code.replace('- [ ] **5', '- [x] **5').replace(/- \[ \] (≈‰‘«¡|≈÷«›…|»—„Ã…) /g, '- [x]  ');
fs.writeFileSync('C:\\Users\\newmo\\.gemini\\antigravity\\brain\\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\\task.md', code);

const fs = require('fs');

const data1 = require('./asma1.json');
const data2 = require('./asma2.json');
const data3 = require('./asma3.json');

const fullData = { ...data1, ...data2, ...data3 };

let fileContent = fs.readFileSync('asma-ul-husna.ts', 'utf8');

// Regex to find each block: { number: X, ... }
for (const [key, value] of Object.entries(fullData)) {
  const num = parseInt(key);
  // Find the block for this number
  const regex = new RegExp(`({\\s*number:\\s*${num},[\\s\\S]*?)(imageUrl:)`, 'g');
  
  fileContent = fileContent.replace(regex, (match, prefix, suffix) => {
    // If it already has evidence filled out (from my manual edit), skip unless it's the "يضاف لاحقا"
    // Wait, the ones in json don't have meaning/name. I need to replace `evidence: "يُضاف لاحقاً من المصادر الشرعية",`
    
    let block = prefix;
    
    // Replace evidence
    block = block.replace(/evidence: "يُضاف لاحقاً من المصادر الشرعية",/, `evidence: "${value.evidence}",`);
    
    // Add reflections, duaa, scholarsSayings right before imageUrl
    // But prefix already contains up to before imageUrl (excluding imageUrl)
    
    // Wait, let's just reconstruct the block cleanly.
    // The regex captures up to imageUrl:
    return `${block}reflections: "${value.reflections}",\n    duaa: "${value.duaa}",\n    scholarsSayings: "${value.scholarsSayings}",\n    ${suffix}`;
  });
}

fs.writeFileSync('asma-ul-husna.ts', fileContent);
console.log('Done merging data.');

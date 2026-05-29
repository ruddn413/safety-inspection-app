import fs from 'fs';

const content = fs.readFileSync('c:/Users/82106/safety-inspection-app/server/dashboard_recovered_views.txt', 'utf-8');
const chunks = content.split('---NEXT---');

const linesMap = new Map();
let maxLine = 0;

for (const chunk of chunks) {
  const lines = chunk.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\d+):(.*)$/);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      let text = match[2];
      if (text.startsWith(' ')) text = text.substring(1);
      linesMap.set(lineNum, text);
      if (lineNum > maxLine) maxLine = lineNum;
    }
  }
}

const finalLines = [];
for (let i = 1; i <= maxLine; i++) {
  if (linesMap.has(i)) {
    finalLines.push(linesMap.get(i));
  } else {
    finalLines.push(`// MISSING LINE ${i}`);
  }
}

fs.writeFileSync('c:/Users/82106/safety-inspection-app/server/dashboard_recovered_combined.ts', finalLines.join('\n'));
console.log('Combined dashboard to dashboard_recovered_combined.ts');

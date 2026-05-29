import fs from 'fs';

const content = fs.readFileSync('c:/Users/82106/safety-inspection-app/server/dashboard_recovered_views.txt', 'utf-8');

const linesMap = new Map();
let maxLine = 0;

const lines = content.split('\n');
for (let line of lines) {
  // Remove \r
  line = line.replace(/\r/g, '');
  const match = line.match(/^(\d+):\s?(.*)$/);
  if (match) {
    const lineNum = parseInt(match[1], 10);
    linesMap.set(lineNum, match[2]);
    if (lineNum > maxLine) maxLine = lineNum;
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
console.log('Done, maxLine:', maxLine);

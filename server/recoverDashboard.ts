import fs from 'fs';

const logPath = 'C:/Users/82106/.gemini/antigravity/brain/fda0e4f9-4322-44de-b21f-dd412d28fa1b/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf-8').split('\n');

let latestFullContent = null;
let viewFileContents = [];

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    // Look for tool_calls (write_to_file or replace_file_content)
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if ((call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') && call.args.TargetFile && call.args.TargetFile.includes('Dashboard.tsx')) {
          // If we had a write_to_file with full content
          if (call.name === 'write_to_file') latestFullContent = call.args.CodeContent;
        }
      }
    }
    
    // Look for view_file output in PLANNER_RESPONSE or system messages
    if (obj.output && typeof obj.output === 'string' && obj.output.includes('Dashboard.tsx') && obj.output.includes('Showing lines')) {
      viewFileContents.push(obj.output);
    }
    // Check content field
    if (obj.content && typeof obj.content === 'string' && obj.content.includes('Dashboard.tsx') && obj.content.includes('Showing lines')) {
      viewFileContents.push(obj.content);
    }
  } catch(e) {}
}

if (latestFullContent) {
  fs.writeFileSync('./dashboard_recovered_full.txt', latestFullContent);
}
fs.writeFileSync('./dashboard_recovered_views.txt', viewFileContents.join('\n\n---NEXT---\n\n'));
console.log('Recovery files created.');

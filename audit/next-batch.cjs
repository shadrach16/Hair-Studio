// Prints the next N un-audited styles: paths for image Reads, then descriptions.
// Usage: node audit/next-batch.js [N] [--paths-only]
const fs = require('fs');
const N = parseInt(process.argv[2] || '10', 10);
const pathsOnly = process.argv.includes('--paths-only');
const THUMBS = 'C:/Users/HP/AppData/Local/Temp/claude/c--Users-HP-Desktop-hairstudio/76b6dd35-b09b-4c2f-8801-314a489960bd/scratchpad/thumbs/';

const rows = fs.readFileSync(process.cwd()+"/audit" + '/export-2026-08-17.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
let done = new Set();
try {
  done = new Set(fs.readFileSync(process.cwd()+"/audit" + '/audit.jsonl', 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l).id));
} catch (e) {}

const todo = rows.filter(r => !done.has(r._id));
console.log(`progress: ${done.size}/${rows.length} audited, ${todo.length} remaining`);
const batch = todo.slice(0, N);
for (const r of batch) console.log('IMG ' + THUMBS + r._id + '.jpg');
if (!pathsOnly) {
console.log('');
for (const r of batch) {
  const desc = r.ai_description.replace(/\s+/g, ' ').slice(0, 1150);
  console.log(`===== ${r._id} | ${r.name} | ${r.category} | ${r.gender}/${r.hairType} | pop:${r.popularity}`);
  console.log(desc + '\n');
}
}

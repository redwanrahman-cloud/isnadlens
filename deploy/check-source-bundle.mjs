import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const audit=JSON.parse(readFileSync('artifacts/deployment-audit-2026-10-06.json','utf8'));
for(const item of audit.source_files){
 const bytes=readFileSync(item.path);
 if(bytes.length!==item.bytes||createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw new Error(`Source bundle mismatch: ${item.path}`);
}
console.log(`Verified ${audit.source_files.length} immutable source files.`);

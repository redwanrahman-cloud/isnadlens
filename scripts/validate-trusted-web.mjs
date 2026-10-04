import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
if(!process.argv.includes('--live'))throw new Error('EXPLICIT_LIVE_FLAG_REQUIRED');
const require=createRequire(import.meta.url),{discoverWebReferences}=require('../artifacts/private/offline-lab-runtime/web-discovery.js');
const quran=process.argv.includes('--quran');
const claim=quran?'Does the Quran command justice and ihsan?':'Does Hadith say Allah looks at hearts and deeds rather than appearance and wealth?';
const result=await discoverWebReferences(claim,claim,quran?'quran':'hadith');
await writeFile(quran?(process.argv.includes('--retry')?'artifacts/trusted-web-quran-repair-live-probe-2026-10-04.json':'artifacts/trusted-web-quran-live-probe-2026-10-04.json'):'artifacts/trusted-web-live-probe-2026-10-04.json',JSON.stringify({kind:'direct_web_discovery_integration_not_fresh_answer_accuracy',claim,result},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));

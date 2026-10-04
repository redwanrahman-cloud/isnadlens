import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transformSync} from 'next/dist/build/swc/index.js';
delete process.env.OPENAI_API_KEY;process.env.ISNADLENS_PAID_CALLS_AUTHORIZED='false';
const before=await readFile('artifacts/private/api-spend.json','utf8');
const root='artifacts/private/offline-lab-runtime';
await writeFile(`${root}/web-discovery.js`,transformSync(await readFile('src/lib/web-discovery.ts','utf8'),{filename:'web-discovery.ts',jsc:{target:'es2022',parser:{syntax:'typescript'}},module:{type:'commonjs'}}).code);
const require=createRequire(import.meta.url),{authenticateQuranReference}=require(`../${root}/web-discovery.js`);
const saved=JSON.parse(await readFile('artifacts/trusted-web-quran-repair-live-probe-2026-10-04.json','utf8'));
const results=[];
for(const page of saved.result.pages){const match=/\/(\d+)\/(\d+)\/?$/.exec(new URL(page.url).pathname);if(match)results.push({url:page.url,locator:`${match[1]}:${match[2]}`,publisher_api_matches_admitted_display:await authenticateQuranReference(`${match[1]}:${match[2]}`,page.url)});}
const result={kind:'source_adapter_recheck_of_saved_web_urls_not_new_model_accuracy',new_api_calls:0,budget_unchanged:before===await readFile('artifacts/private/api-spend.json','utf8'),results};
await writeFile('artifacts/trusted-web-quran-source-repair-2026-10-04.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));

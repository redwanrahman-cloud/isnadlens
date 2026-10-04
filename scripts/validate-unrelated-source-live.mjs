import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transformSync} from 'next/dist/build/swc/index.js';
process.loadEnvFile('.env.local');
const directory='artifacts/private/grounding-probe-runtime';
await mkdir(directory,{recursive:true});await writeFile(`${directory}/package.json`,JSON.stringify({type:'commonjs'}));
for(const name of ['provider','contracts','budget','claim-language','corpus']){const raw=await readFile(`src/lib/${name}.ts`,'utf8');await writeFile(`${directory}/${name}.js`,(transformSync(raw,{filename:`${name}.ts`,jsc:{target:'es2022',parser:{syntax:'typescript'}},module:{type:'commonjs'}})).code);}
const require=createRequire(import.meta.url),provider=require(`../${directory}/provider.js`);
const record=JSON.parse(await readFile('artifacts/private/holdout50-first-pass/H42.json','utf8'));
const result=await provider.reviewPositiveEntailment(record.original_claim,record.semantic_assessment,record.evidence_items);
const rejected=result.review.atoms.every(atom=>atom.entails!=='yes');
await writeFile(process.argv[2]==='units'?'artifacts/source-entailment-unrelated-unit-live-2026-10-04.json':'artifacts/source-entailment-unrelated-live-2026-10-04.json',JSON.stringify({purpose:'Real source-focused validator probe: known true strength/anger proposition paired with the actual unrelated first-pass predestination evidence, without injecting expected answers.',model:result.model,version:provider.ENTAILMENT_VERSION,rejected_unrelated_evidence:rejected,atom_decisions:result.review.atoms.map(atom=>({atom_id:atom.atom_id,entails:atom.entails})),usage:result.usage},null,2)+'\n');
console.log(JSON.stringify({rejected_unrelated_evidence:rejected,decisions:result.review.atoms.map(atom=>atom.entails)}));if(!rejected)process.exitCode=1;

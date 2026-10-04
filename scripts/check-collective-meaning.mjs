import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {applicationTreeHash} from './holdout-protocol.mjs';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
const require=createRequire(import.meta.url);require('@next/env').loadEnvConfig(process.cwd());
const {reviewOriginalMeaning}=require('../artifacts/private/offline-lab-runtime/provider.js');
const a=JSON.parse(await readFile('artifacts/private/release30-round2-first-pass/V01.json','utf8'));
const b=JSON.parse(await readFile('artifacts/private/release30-round2-first-pass/V27.json','utf8'));
const reversed=structuredClone(a.assessment_attempts[0].raw_assessment);
reversed.atomic_claims[0].text=reversed.atomic_claims[0].text.replace('avoiding miserly withholding','encouraging miserly withholding');
if(reversed.atomic_claims[0].text===a.assessment_attempts[0].raw_assessment.atomic_claims[0].text)throw new Error('CONTROL_NOT_CHANGED');
const report={kind:'known_decomposition_meaning_only_controls_not_religious_accuracy',application_tree_sha256:await applicationTreeHash(),cases:[],started_at:new Date().toISOString()};
const destination='artifacts/round2-collective-meaning-controls-2026-10-05.json';
await writeFile(destination,JSON.stringify(report,null,2),{flag:'wx'});
for(const [id,claim,assessment,expected] of [['V01-recorded-split',a.original_claim,a.assessment_attempts[0].raw_assessment,'yes'],['V27-recorded-split',b.original_claim,b.assessment_attempts[0].raw_assessment,'yes'],['V01-reversed-action',a.original_claim,reversed,'no']]){
 if(await applicationTreeHash()!==report.application_tree_sha256)throw new Error('APPLICATION_CHANGED');
 const result=await reviewOriginalMeaning(claim,assessment);
 report.cases.push({id,expected,actual:result.review.faithful,passed:result.review.faithful===expected,model:result.model,usage:result.usage});
 await writeFile(destination,JSON.stringify(report,null,2));console.log(JSON.stringify(report.cases.at(-1)));
}
report.completed_at=new Date().toISOString();report.settled_sar=report.cases.reduce((n,c)=>n+(c.usage?.estimated_cost_usd??0),0)*3.75;
report.final_development_sar=JSON.parse(await readFile('artifacts/private/api-spend.json','utf8')).entries.reduce((n,e)=>n+(e.status==='settled'?e.actual_usd:e.reserved_usd),0)*3.75;
await writeFile(destination,JSON.stringify(report,null,2));

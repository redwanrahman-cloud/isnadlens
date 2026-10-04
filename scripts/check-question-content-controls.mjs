import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
const offline=JSON.parse(await readFile('artifacts/offline-question-content-2026-10-04.json','utf8'));
if(offline.failures.length||offline.new_api_calls!==0||!offline.budget_unchanged)throw new Error('OFFLINE_GATE_FAILED');
process.loadEnvFile('.env.local');
const {reviewOriginalMeaning,ENTAILMENT_VERSION}=createRequire(import.meta.url)('../artifacts/private/offline-lab-runtime/provider.js');
const t36=JSON.parse(await readFile('artifacts/private/final50-post-repair/T36.json','utf8'));
const t19=JSON.parse(await readFile('artifacts/private/final50-post-repair/T19.json','utf8'));
const cases=[['clothes_faithful',t36.original_claim,t36.assessment_attempts[0].raw_assessment,'yes'],['clothes_silently_corrected',t36.original_claim,t36.semantic_assessment,'no'],['french_faithful',t19.original_claim,t19.assessment_attempts[0].raw_assessment,'yes'],['french_silently_corrected',t19.original_claim,t19.semantic_assessment,'no']];
const report={kind:'live_question_content_controls_not_answer_accuracy',version:ENTAILMENT_VERSION,cases:[]};
for(const [id,claim,a,expected] of cases){const check=await reviewOriginalMeaning(claim,a);const actual=check.review.faithful;const row={id,expected,actual,passed:actual===expected,...check};report.cases.push(row);console.log(JSON.stringify({id,expected,actual,passed:row.passed}));}
await writeFile('artifacts/question-content-controls-2026-10-04.json',JSON.stringify(report,null,2),{flag:'wx'});
if(report.cases.some(c=>!c.passed))process.exitCode=1;

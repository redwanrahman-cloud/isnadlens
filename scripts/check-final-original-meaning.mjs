import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
process.loadEnvFile('.env.local');
const require=createRequire(import.meta.url);
const {reviewPositiveEntailment,ENTAILMENT_VERSION}=require('../artifacts/private/offline-lab-runtime/provider.js');
const saved=JSON.parse(await readFile('artifacts/private/web15-first-pass/W06.json','utf8'));
const faithful=structuredClone(saved.semantic_assessment);
faithful.atomic_claims[0].text='Man soll laut Koran eine Tat für morgen versprechen, ohne „wenn Allah will“ zu sagen.';
const report={kind:'live_saved_bad_atom_and_faithful_control_not_new_holdout',version:ENTAILMENT_VERSION,cases:[]};
for(const [id,a,expected] of [['silently_corrected_atom',saved.semantic_assessment,'no'],['faithful_original_proposition',faithful,'yes']]){
 const checked=await reviewPositiveEntailment(saved.original_claim,a,saved.evidence_items,'decision');
 const actual=checked.review.atoms[0]?.entails;
 report.cases.push({id,expected,actual,passed:actual===expected,review:checked.review,model:checked.model,usage:checked.usage});
 console.log(JSON.stringify({id,actual,expected,passed:actual===expected}));
}
await writeFile('artifacts/final-original-meaning-controls-2026-10-04.json',JSON.stringify(report,null,2),{flag:'wx'});
if(report.cases.some(c=>!c.passed))process.exitCode=1;

// Explicit live validation, separate from all free/offline tests. Never changes the authorized cap.
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {applicationTreeHash} from './holdout-protocol.mjs';
if(!process.argv.includes('--live'))throw new Error('EXPLICIT_LIVE_FLAG_REQUIRED');
process.loadEnvFile('.env.local');
const require=createRequire(import.meta.url);
// Run the offline lab first to compile the current libraries; no production code consumes this runtime.
const root='../artifacts/private/offline-lab-runtime';
const {assessClaim,reviewPositiveEntailment}=require(`${root}/provider.js`);
const {loadCorpus}=require(`${root}/corpus.js`);
const {authenticateEvidence,validPositiveReview,verifySeal}=require(`${root}/verification.js`);
const {verifyMultilingualClaim}=require(`${root}/multilingual-intake.js`);
const {primaryModel}=require(`${root}/model-config.js`);
if(primaryModel()!=='gpt-5.6-luna')throw new Error('UPGRADE_CONFIGURATION_MISMATCH');
const corpus=loadCorpus();
const evidence=[authenticateEvidence(corpus,corpus.verses.find(v=>v.id==='112:1'))];
const runs=[];
for(const model of ['gpt-5.6-luna','gpt-5.6-terra']){
 const result=await assessClaim('Does the Quran say Allah is One?','en',evidence,model);
 const {decideVerdict}=require(`${root}/policy.js`);
 const verdict=decideVerdict(result.assessment,new Set(evidence.map(e=>e.evidence_id)));
 const review=await reviewPositiveEntailment('Does the Quran say Allah is One?',result.assessment,evidence);
 const passed=verdict==='supported_within_selected_corpus'&&validPositiveReview(review.review,result.assessment,evidence);
 const raw={model,reasoning:'low',claim:'Does the Quran say Allah is One?',result,review,evidence,passed};
 await writeFile(`artifacts/private/model-upgrade-${model}.json`,JSON.stringify(raw,null,2)+'\n',{flag:'wx'});
 runs.push({model,reasoning:'low',verdict,source_check_passed:passed,summary_en:result.assessment.summary_en,usage:[result.usage,review.usage]});
 console.log(JSON.stringify({model,verdict,source_check_passed:passed}));
 if(!passed)throw new Error('LIVE_MODEL_SOURCE_CHECK_FAILED');
}
const data=JSON.parse(await readFile('artifacts/holdout-question-set-50-2026-10-04.json','utf8'));
const item=data.cases.find(c=>c.id==='H12');
const record=await verifyMultilingualClaim({claim:item.claim,inputLanguage:'en',corpusSelection:'quran'});
await writeFile('artifacts/private/model-upgrade-context-H12.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});
const passed=record.verdict==='supported_within_selected_corpus'&&verifySeal(record)&&record.original_claim===item.claim&&record.evidence_items.every(e=>e.integrity.passed);
const report={kind:'targeted_live_migration_checks_not_new_50_question_benchmark',created_at:new Date().toISOString(),application_tree_sha256:await applicationTreeHash(),models:runs,context_retest:{id:item.id,claim:item.claim,expected:'supported_within_selected_corpus',actual:record.verdict,reason_codes:record.reason_codes,model:record.model,passed,seal_valid:verifySeal(record),summary_en:record.summary_en,evidence:record.evidence_items.map(e=>({locator:e.locator,relation:e.semantic_relation,context:e.source_context.map(c=>c.locator)})),usage:[record.retrieval_plan?.usage,...(record.assessment_attempts??[]).map(a=>a.usage),record.entailment_review?.usage].filter(Boolean)},all_passed:runs.every(r=>r.source_check_passed)&&passed};
report.report_sha256=createHash('sha256').update(JSON.stringify(report)).digest('hex');
await writeFile('artifacts/model-upgrade-validation-2026-10-04.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({context_retest:report.context_retest.actual,all_passed:report.all_passed}));
if(!report.all_passed)process.exitCode=1;

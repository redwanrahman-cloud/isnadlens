import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {hash,applicationTreeHash} from './holdout-protocol.mjs';
const datasetPath='artifacts/holdout-question-set-50-2026-10-04.json';
const raw=await readFile(datasetPath,'utf8'),dataset=JSON.parse(raw);
const review=await readFile('docs/HOLDOUT50-REVIEW.md','utf8');
if(!review.includes('PRE_FREEZE_REVIEW_COMPLETE'))throw new Error('Independent source review must complete before freeze');
if(dataset.cases.length!==50||new Set(dataset.cases.map(item=>item.claim.trim().toLowerCase())).size!==50)throw new Error('Fifty distinct questions required');
const yesQ=dataset.cases.filter(item=>item.reference_answer==='yes'&&item.corpus_selection==='quran');
const noQ=dataset.cases.filter(item=>item.reference_answer==='no'&&item.corpus_selection==='quran');
const yesH=dataset.cases.filter(item=>item.reference_answer==='yes'&&item.corpus_selection==='hadith');
if(yesQ.length!==30||noQ.length!==10||yesH.length!==10)throw new Error('Predeclared 30 supported Quran / 10 contradicted Quran / 10 supported Hadith split changed');
const execution_order=[];
for(let block=0;block<5;block++){for(let offset=0;offset<2;offset++){execution_order.push(...yesQ.splice(0,3).map(item=>item.id),noQ.shift().id,yesH.shift().id);}}
const freeze={dataset_id:dataset.dataset_id,frozen_at:new Date().toISOString(),dataset_sha256:hash(raw),independent_review_sha256:hash(review),application_commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),application_tree_sha256:await applicationTreeHash(),production_build_id:(await readFile('.next/BUILD_ID','utf8')).trim(),execution_order,execution_order_rule:'Five blocks of ten: six supported Quran, two contradicted Quran, two supported Hadith. No adaptive ordering or hints.',planned:50,expected_yes:40,expected_no:10,authorized_development_max_usd:3.46,paid_budget:'Human approved up to3SAR extra,13SAR total development on4October2026; keep15SAR judging reserve. Conservative unknown reservations retained.'};
await writeFile('artifacts/holdout50-freeze-2026-10-04.json',JSON.stringify(freeze,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({frozen:50,dataset_sha256:freeze.dataset_sha256,application_commit:freeze.application_commit,execution_order}));

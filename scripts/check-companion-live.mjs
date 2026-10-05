import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
const root='artifacts/private/companion-live-2026-10-05';mkdirSync(root,{recursive:true});
const cost=()=>JSON.parse(readFileSync('artifacts/private/api-spend.json','utf8')).entries.reduce((sum,row)=>sum+(row.status==='settled'?row.actual_usd:row.reserved_usd),0)*3.75;
const report={kind:'bounded_companion_integration_smoke_not_accuracy_benchmark',started:new Date().toISOString(),starting_sar:cost(),cap_sar:49,cases:[]};
const cases=[
  {id:'P01',claim:'Does the Quran describe Safa and Marwah as symbols of Allah?',expected:'supported_within_selected_corpus',source:'2:158'},
  {id:'P02',claim:'هل يبيح القرآن طلب الرزق أثناء الحج؟',expected:'supported_within_selected_corpus',source:'2:198'},
  {id:'P03',claim:'What does Islam say about eating pork?',expected:'not_evaluated',reason:'PILGRIMAGE_MAIN_TOOL_REFERRAL'},
];
for(const item of cases){
  if(49-cost()<.4)throw new Error('SMOKE_REMAINING_BUDGET_STOP');
  const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:'auto',service:'pilgrimage'}),signal:AbortSignal.timeout(180000)});
  const record=await response.json();writeFileSync(`${root}/${item.id}.json`,JSON.stringify(record,null,2));
  const row={...item,status:response.status,verdict:record.verdict,reason_codes:record.reason_codes,topic:record.language_intake?.pilgrimage_topic,input_language:record.input_language,summary_en:record.summary_en,summary_ar:record.summary_ar,evidence:(record.evidence_items??[]).map(card=>({source_id:card.source_id,locator:card.locator,quotation:card.quotation,integrity:card.integrity.passed})),original_preserved:record.original_claim===item.claim};
  report.cases.push(row);report.ending_sar=cost();report.cost_sar=report.ending_sar-report.starting_sar;
  writeFileSync('artifacts/companion-smoke-2026-10-05.json',JSON.stringify(report,null,2));console.log(JSON.stringify(row));
  if(response.status!==200)break;
}
console.log(JSON.stringify({cases:report.cases.length,cost_sar:report.cost_sar,ending_sar:report.ending_sar}));
if(report.cases.length!==3||report.cases.some(row=>row.verdict!==row.expected||!row.original_preserved||(row.reason&&!row.reason_codes?.includes(row.reason))))process.exitCode=1;

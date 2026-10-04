import {expect,test} from 'vitest';
// The standalone Node helper intentionally has no runtime dependency on app code.
import {createReplayStore,requestFromRecord} from '../scripts/lib/offline-replay.mjs';
const record={original_claim:'A question',input_language:'en',corpus_selection:'quran',model:'recorded-model',prompt_version:'p1',schema_version:'s1',router_version:'r1',corpus_manifest:{id:'edition'},corpus_sha256:'hash',evidence_items:[{evidence_id:'v1',quotation:'Exact original',quotation_sha256:'hash',source_context:[],semantic_relation:'supports'}],verdict:'supported',audit_hash:'seal'};
test('historical replay requires exact question, evidence, edition, routing and model versions',()=>{
 const store=createReplayStore([record]),request=requestFromRecord(record);
 expect(store.replay(request)).toMatchObject({mode:'historical_replay_not_new_inference',new_api_calls:0,new_api_cost_usd:0});
 for(const change of [{claim:'A paraphrased question'},{model:'different-model'},{prompt:'p2'},{language:'ar'},{corpus_hash:'other-edition'},{evidence:[]}]) expect(()=>store.replay({...request,...change})).toThrow('REPLAY_CACHE_MISS_REQUIRES_LIVE');
 const textChanged=structuredClone(request);textChanged.evidence[0].quotation='Changed';expect(()=>store.replay(textChanged)).toThrow('REPLAY_CACHE_MISS_REQUIRES_LIVE');
 const contextChanged=structuredClone(request);contextChanged.evidence[0].source_context=[{quotation:'new context'}];expect(()=>store.replay(contextChanged)).toThrow('REPLAY_CACHE_MISS_REQUIRES_LIVE');
});
test('replay never mutates fixtures or merges inconsistent historical outputs',()=>{
 const store=createReplayStore([record]),request=requestFromRecord(record);
 store.replay(request).historical_record.evidence_items[0].quotation='mutated';
 expect(store.replay(request).historical_record.evidence_items[0].quotation).toBe('Exact original');
 expect(()=>createReplayStore([record,{...record,verdict:'conflicting'}])).toThrow('AMBIGUOUS_HISTORICAL_REPLAY');
});

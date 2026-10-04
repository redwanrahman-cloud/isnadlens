import {createHash} from 'node:crypto';

const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,canonical(value[key])])) : value;
export const fingerprint = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

// Full historical packet identity. No approximate claim matching or semantic guessing.
export function requestFromRecord(record) {
  return {
    claim:record.original_claim, language:record.input_language, selection:record.corpus_selection,
    model:record.model, prompt:record.prompt_version, schema:record.schema_version, router:record.router_version,
    corpus:record.corpus_manifest, corpus_hash:record.corpus_sha256,
    intake:record.language_intake, search:record.retrieval_plan,
    evidence:record.evidence_items.map(({semantic_relation,...item})=>item),
  };
}
export function createReplayStore(records) {
  const fixtures=new Map();
  for(const record of records){
    const key=fingerprint(requestFromRecord(record));
    const existing=fixtures.get(key);
    if(existing && fingerprint(existing)!==fingerprint(record)) throw new Error('AMBIGUOUS_HISTORICAL_REPLAY');
    fixtures.set(key,structuredClone(record));
  }
  return {
    size:fixtures.size,
    replay(request){
      const key=fingerprint(request),record=fixtures.get(key);
      if(!record) throw new Error('REPLAY_CACHE_MISS_REQUIRES_LIVE');
      return {mode:'historical_replay_not_new_inference',request_fingerprint:key,
        new_api_calls:0,new_api_cost_usd:0,historical_record:structuredClone(record)};
    },
  };
}

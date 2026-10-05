import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {detectAndRouteClaim,verifyMultilingualClaim} from '../src/lib/multilingual-intake';
import * as provider from '../src/lib/provider';
import * as budget from '../src/lib/budget';
import {verifySeal} from '../src/lib/verification';
import {recordSchema} from '../src/lib/contracts';
beforeEach(()=>{
  vi.stubEnv('OPENAI_MODEL','gpt-5.6-luna');vi.stubEnv('ISNADLENS_MAX_CALLS','1000');vi.stubEnv('ISNADLENS_WEB_SEARCH_ENABLED','false');
  vi.stubEnv('OPENAI_API_KEY','test-only');vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED','true');
  vi.spyOn(provider,'providerReady').mockReturnValue(true);vi.spyOn(budget,'reserveSpend').mockReturnValue('fake');vi.spyOn(budget,'settleSpend').mockReturnValue(.001);
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();});
function route(topic:'pilgrimage'|'other'|'unclear',scope='textual'){return {pilgrimage_topic:topic,scope_confidence:'high',clarification_en:null,clarification_ar:null,detected_language:'en',confidence:'high',scope_category:scope,english_gloss:'A faithfully routed question.',arabic_terms:['الحج'],english_terms:['pilgrimage']};}
function response(data:unknown){return new Response(JSON.stringify({status:'completed',model:'gpt-5.6-luna',usage:{input_tokens:10,output_tokens:10},output:[{content:[{type:'output_text',text:JSON.stringify(data)}]}]}));}
it('admits meaning about Sai without a mandatory Hajj/Umrah keyword',async()=>{
  const network=vi.fn(async(_url:string|URL,_options?:RequestInit)=>response(route('pilgrimage')));vi.stubGlobal('fetch',network);
  const result=await detectAndRouteClaim('Does walking between Safa and Marwah begin at Safa?','auto','pilgrimage');
  expect(result.status).toBe('accepted');expect(result.pilgrimage_topic).toBe('pilgrimage');expect(network).toHaveBeenCalledOnce();
  const body=JSON.parse(network.mock.calls[0][1]!.body as string);expect(body.text.format.schema.required).toContain('pilgrimage_topic');expect(body.instructions).toContain('Do not require literal Umrah/Hajj words');
});
it.each(['What does Islam say about pork?','Explain Umrah and also explain inheritance.','What is the weather?'])('refers confirmed other requests to main without answering them: %s',async claim=>{
  const network=vi.fn(async(_url:string|URL,_options?:RequestInit)=>response(route('other')));vi.stubGlobal('fetch',network);const assessment=vi.spyOn(provider,'assessClaim');
  const result=await verifyMultilingualClaim({claim,focus:'pilgrimage'});
  expect(result.reason_codes).toEqual(['PILGRIMAGE_MAIN_TOOL_REFERRAL']);expect(result.verdict).toBe('not_evaluated');expect(result.evidence_items).toHaveLength(0);expect(assessment).not.toHaveBeenCalled();expect(network).toHaveBeenCalledTimes(2);expect(verifySeal(result)).toBe(true);expect(recordSchema.safeParse(result).success).toBe(true);
});
it('asks which pilgrimage step is meant when topic context is missing',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response(route('unclear'))));const assessment=vi.spyOn(provider,'assessClaim');
  const result=await verifyMultilingualClaim({claim:'How do I complete this step?',focus:'pilgrimage'});
  expect(result.reason_codes).toEqual(['CLAIM_CLARIFICATION_REQUIRED']);expect(assessment).not.toHaveBeenCalled();
});
it('preserves the existing qualified referral for personal pilgrimage validity',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response(route('pilgrimage','personal'))));const assessment=vi.spyOn(provider,'assessClaim');
  const result=await verifyMultilingualClaim({claim:'I lost count during my Tawaf; is my completed ritual valid?',focus:'pilgrimage'});
  expect(result.reason_codes).toEqual(['PERSONAL_RULING_REFERRAL']);expect(assessment).not.toHaveBeenCalled();
});
it('does not change the main-tool prompt or schema',async()=>{
  const output=route('pilgrimage');const {pilgrimage_topic,...main}=output;void pilgrimage_topic;
  const network=vi.fn(async(_url:string|URL,_options?:RequestInit)=>response(main));vi.stubGlobal('fetch',network);
  await detectAndRouteClaim('What does Islam say about patience?','auto');
  const body=JSON.parse(network.mock.calls[0][1]!.body as string);expect(body.text.format.schema.properties.pilgrimage_topic).toBeUndefined();expect(body.instructions.startsWith('You ONLY route')).toBe(true);
});
it('cannot proceed without the required companion-topic classification',async()=>{
  const {pilgrimage_topic,...main}=route('pilgrimage');void pilgrimage_topic;vi.stubGlobal('fetch',vi.fn(async()=>response(main)));
  await expect(detectAndRouteClaim('How many rounds are there in Tawaf?','auto','pilgrimage')).rejects.toThrow('INTAKE_SCHEMA_INVALID');
});

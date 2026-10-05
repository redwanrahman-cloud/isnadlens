import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {inputValidityGate} from '../src/lib/policy';
import {detectAndRouteClaim,verifyMultilingualClaim} from '../src/lib/multilingual-intake';
import * as provider from '../src/lib/provider';
import * as budget from '../src/lib/budget';
import * as planner from '../src/lib/query-planner';
import {authenticateEvidence,validPositiveReview,verifyClaim,verifyClaimWithRecovery,verifySeal} from '../src/lib/verification';
import {loadCorpus} from '../src/lib/corpus';
import {recordSchema,type SemanticAssessment} from '../src/lib/contracts';

beforeEach(()=>{
 vi.stubEnv('OPENAI_MODEL','gpt-5.6-luna');vi.stubEnv('ISNADLENS_MAX_CALLS','1000');vi.stubEnv('ISNADLENS_WEB_SEARCH_ENABLED','false');
 vi.stubEnv('OPENAI_API_KEY','test-only-not-a-real-key');vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED','true');vi.stubEnv('ISNADLENS_MAX_SPEND_USD','1');
 vi.spyOn(provider,'providerReady').mockReturnValue(true);vi.spyOn(budget,'reserveSpend').mockReturnValue('fake-reservation');vi.spyOn(budget,'settleSpend').mockReturnValue(.001);
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();vi.unstubAllGlobals();});
function route(scope='textual',language:string|null='en',confidence='high'){return {scope_confidence:'high',clarification_en:null,clarification_ar:null,detected_language:language,confidence,scope_category:scope,english_gloss:'What does Islam say about patience?',arabic_terms:scope==='textual'?['الصبر']:[],english_terms:scope==='textual'?['patience']:[]};}
function response(data:unknown,model='gpt-5.6-luna'){return new Response(JSON.stringify({status:'completed',model,usage:{input_tokens:100,output_tokens:100},output:[{content:[{type:'output_text',text:JSON.stringify(data)}]}]}));}
it.each(['Patience has a reward in Islam.','What does Islam say about debt?','What does the Quran say about illness?','Can I learn about prayer?','Zakat?'])('does not reject valid topics or capitalization before model understanding: %s',async claim=>{
 const f=vi.fn().mockResolvedValue(response(route()));vi.stubGlobal('fetch',f);
 expect(inputValidityGate(claim)).toBeNull();expect((await detectAndRouteClaim(claim,'auto')).status).toBe('accepted');expect(f).toHaveBeenCalledOnce();
});
it.each(['general','personal','sensitive','injection','unsupported'])('independently reviews a proposed %s rejection without leaking the first label to Terra',async scope=>{
 const f=vi.fn().mockResolvedValueOnce(response(route(scope))).mockResolvedValueOnce(response(route(),'gpt-5.6-terra'));vi.stubGlobal('fetch',f);
 const r=await detectAndRouteClaim('What does Islam say about debt?','auto');expect(r.status).toBe('accepted');expect(r.routing_attempts).toHaveLength(2);
 const body=JSON.parse(f.mock.calls[1][1].body);expect(body.model).toBe('gpt-5.6-terra');expect(JSON.parse(body.input)).toEqual({original_claim:'What does Islam say about debt?',requested_language:'auto'});
});
it.each([['general','OUTSIDE_SUPPORTED_CLAIM_SCOPE'],['personal','PERSONAL_RULING_REFERRAL'],['sensitive','SENSITIVE_SCOPE_REFERRAL'],['injection','INSTRUCTION_INJECTION']])('a confirmed %s boundary does not reach assessment',async(scope,reason)=>{
 const f=vi.fn().mockResolvedValueOnce(response(route(scope))).mockResolvedValueOnce(response(route(scope),'gpt-5.6-terra'));vi.stubGlobal('fetch',f);
 const assess=vi.spyOn(provider,'assessClaim');const r=await verifyMultilingualClaim({claim:'This is a boundary request.',inputLanguage:'auto'});
 expect(r.reason_codes).toEqual([reason]);expect(assess).not.toHaveBeenCalled();expect(r.language_intake?.routing_attempts).toHaveLength(2);expect(verifySeal(r)).toBe(true);expect(recordSchema.safeParse(r).success).toBe(true);
});
it('offers clarification only after both routes remain ambiguous',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>response(route('textual',null,'low'))));const assess=vi.spyOn(provider,'assessClaim');
 const r=await verifyMultilingualClaim({claim:'Islam prayer fasting',inputLanguage:'auto'});expect(r.reason_codes).toEqual(['LANGUAGE_SELECTION_REQUIRED']);expect(r.language_intake?.routing_attempts).toHaveLength(2);expect(assess).not.toHaveBeenCalled();
});
it('asks about the missing action instead of mislabeling clear English as an unknown language',async()=>{
 const payload={...route('clarification'),scope_confidence:'low',clarification_en:'Which action are you asking about?',clarification_ar:'ما الفعل الذي تسأل عنه؟'};
 vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>response(payload)));const assess=vi.spyOn(provider,'assessClaim');
 const r=await verifyMultilingualClaim({claim:'Is this allowed?',inputLanguage:'auto'});expect(r.reason_codes).toEqual(['CLAIM_CLARIFICATION_REQUIRED']);expect(r.summary_en).toBe(payload.clarification_en);expect(r.language_intake?.detected_language).toBe('en');expect(r.language_intake?.status).toBe('referred');expect(r.language_intake?.routing_attempts).toHaveLength(2);expect(assess).not.toHaveBeenCalled();expect(verifySeal(r)).toBe(true);
});
it('explicit compatible language gives the stronger reviewer another opportunity',async()=>{
 const f=vi.fn().mockResolvedValueOnce(response(route('textual','fr','medium'))).mockResolvedValueOnce(response(route('textual','fr','high'),'gpt-5.6-terra'));vi.stubGlobal('fetch',f);
 const r=await detectAndRouteClaim('Que dit le Coran sur la patience?','fr');expect(r.status).toBe('accepted');expect(r.detected_language).toBe('fr');expect(JSON.parse(f.mock.calls[1][1].body).input).toContain('fr');
});
it('stops after a failed stronger route and retains both usages',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(response(route('personal'))).mockRejectedValueOnce(new TypeError('offline')));const assess=vi.spyOn(provider,'assessClaim');
 const r=await verifyMultilingualClaim({claim:'A religious learning question',inputLanguage:'auto'});expect(r.reason_codes).toEqual(['PROVIDER_UNAVAILABLE']);expect(r.language_intake?.routing_attempts?.[0].usage).not.toBeNull();expect(r.language_intake?.routing_attempts?.[1].status).toBe('unavailable');expect(assess).not.toHaveBeenCalled();
});
it.each(['','a','x'.repeat(1201),'my phone 123456789012'])('retains mechanical pre-provider guards: %s',async claim=>{
 const f=vi.fn();vi.stubGlobal('fetch',f);await expect(detectAndRouteClaim(claim,'auto')).rejects.toBeInstanceOf(Error);expect(f).not.toHaveBeenCalled();
});
const q=()=>loadCorpus();
const card=(id:string)=>authenticateEvidence(q(),q().verses.find(v=>v.id===id)!);
function assessment(claim:string,ids:string[]):SemanticAssessment{return {in_scope:true,original_meaning_preserved:true,all_material_claims_covered:true,summary_en:'The supplied source supports the stated claim.',summary_ar:'يدعم المصدر الوارد الادعاء.',limitations:[],atomic_claims:[{id:'a',text:claim,material:true,relation:'supports',evidence_ids:ids,direct:true,context_fit:true,negation_checked:true,modality_checked:true,qualifications_preserved:true,attribution_matched:true,scope_matched:true,contradiction_basis:'none',basis_evidence_id:null,basis_quotation:null}]};}
it('requires final explanation approval even when every source relationship passes',()=>{
 const c=card('2:173'),a=assessment('A claim',[c.evidence_id]);const row={atom_id:'a',entails:'yes' as const,attribution_preserved:true,qualifications_preserved:true,evidence_id:c.evidence_id,context_locator:null,basis_quotation:c.quotation};
 expect(validPositiveReview({atoms:[row]},a,[c])).toBe(false);expect(validPositiveReview({explanation_preserved:false,atoms:[row]},a,[c])).toBe(false);expect(validPositiveReview({explanation_preserved:true,atoms:[row]},a,[c])).toBe(true);
});
it('combines exact separately attributed units and rejects forged, uncited, duplicated or shortened proof',()=>{
 const c=card('2:173'),d=card('5:3'),a=assessment('A combined claim',[c.evidence_id,d.evidence_id]);const units=provider.buildSourceUnits([c,d]);
 const raw={explanation_preserved:true,atoms:[{atom_id:'a',entails:'yes' as const,attribution_preserved:true,qualifications_preserved:true,basis_unit_id:units[0].unit_id,additional_basis_unit_ids:[`${d.evidence_id}:primary`]}]};
 const r=provider.resolveUnitReview(raw,units);expect(validPositiveReview(r,a,[c,d])).toBe(true);
 expect(validPositiveReview(r,assessment('A combined claim',[c.evidence_id]),[c,d])).toBe(false);
 expect(()=>provider.resolveUnitReview({...raw,atoms:[{...raw.atoms[0],additional_basis_unit_ids:['invented']}]},units)).toThrow('SOURCE_UNIT_INVALID');
 expect(()=>provider.resolveUnitReview({...raw,atoms:[{...raw.atoms[0],additional_basis_unit_ids:[units[0].unit_id]}]},units)).toThrow('SOURCE_UNIT_INVALID');
 r.atoms[0].additional_basis![0].basis_quotation='forged';expect(validPositiveReview(r,a,[c,d])).toBe(false);
 r.atoms[0].additional_basis=[];r.atoms[0].basis_quotation=c.quotation.slice(0,20);expect(validPositiveReview(r,a,[c,d])).toBe(false);
});
it('sends BOTH final explanations to Terra without an additional paid reviewer call',async()=>{
 const c=card('2:173'),a=assessment('An original question',[c.evidence_id]);
 const f=vi.fn().mockResolvedValue(response({explanation_preserved:true,atoms:[{atom_id:'a',source_relationship:'supports',entails:'yes',attribution_preserved:true,qualifications_preserved:true,basis_unit_id:`${c.evidence_id}:primary`,additional_basis_unit_ids:[]}]},'gpt-5.6-terra'));vi.stubGlobal('fetch',f);
 const r=await provider.reviewPositiveEntailment('An original question',a,[c]);expect(r.review.explanation_preserved).toBe(true);expect(f).toHaveBeenCalledOnce();const b=JSON.parse(f.mock.calls[0][1].body);expect(b.model).toBe('gpt-5.6-terra');expect(JSON.parse(b.input).draft_explanation).toEqual({summary_en:a.summary_en,summary_ar:a.summary_ar});
});
it('shares extra prose citations and publisher commentary without expanding an atom proof',async()=>{
 const c=card('10:44'),extra=card('4:49');extra.publisher_fields={explanation:'Publisher commentary only',grade:'Publisher grade only'};
 const a=assessment('An original question',[c.evidence_id]);
 const f=vi.fn().mockResolvedValue(response({explanation_preserved:true,explanation_diagnostic:{reason:'none',language:null,sentence:null,detail:''},atoms:[{atom_id:'a',source_relationship:'supports',entails:'yes',attribution_preserved:true,qualifications_preserved:true,basis_unit_id:`${c.evidence_id}:primary`,additional_basis_unit_ids:[]}]}));vi.stubGlobal('fetch',f);
 const r=await provider.reviewPositiveEntailment('An original question',a,[c,extra]);const input=JSON.parse(JSON.parse(f.mock.calls[0][1].body).input);
 expect(input.explanation_evidence).toEqual(provider.explanationEvidence([c,extra]));
 expect(input.explanation_evidence[1].publisher_explanation).toBe('Publisher commentary only');
 expect(input.source_units.some((u:{evidence_id:string})=>u.evidence_id===extra.evidence_id)).toBe(false);
 expect(validPositiveReview(r.review,a,[c,extra])).toBe(true);
 extra.quotation+='forged';expect(()=>provider.explanationEvidence([c,extra])).toThrow('PACKET_INTEGRITY_FAILURE');
});
it('preserves a rejected translation sentence and rejects contradictory diagnostics',()=>{
 const c=card('10:44'),units=provider.buildSourceUnits([c]);
 const raw={explanation_preserved:false,explanation_diagnostic:{reason:'translation_mismatch' as const,language:'ar' as const,sentence:'An altered Arabic sentence',detail:'Negation was reversed.'},atoms:[{atom_id:'a',entails:'yes' as const,attribution_preserved:true,qualifications_preserved:true,basis_unit_id:units[0].unit_id,additional_basis_unit_ids:[]}]};
 expect(provider.resolveUnitReview(raw,units).explanation_diagnostic).toEqual(raw.explanation_diagnostic);
 expect(()=>provider.resolveUnitReview({...raw,explanation_preserved:true},units)).toThrow('EXPLANATION_DIAGNOSTIC_INVALID');
});
it('repairs a rejected explanation once on identical evidence, retaining the first failed review',async()=>{
 const claim='Does the Quran prohibit eating pork?';const packets:string[][]=[];
 const assess=vi.spyOn(provider,'assessClaim').mockImplementation(async(_c,_l,cards,model)=>{packets.push(cards.map(c=>c.evidence_id));return {model:model!,usage:null,assessment:assessment(claim,[cards.find(c=>c.locator==='2:173')!.evidence_id])};});
 let reviews=0;vi.spyOn(provider,'reviewPositiveEntailment').mockImplementation(async(_c,a,cards)=>({model:'gpt-5.6-terra',usage:null,review:{explanation_preserved:++reviews>1,atoms:[{atom_id:'a',entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:a.atomic_claims[0].evidence_ids[0],context_locator:null,basis_quotation:cards.find(c=>c.evidence_id===a.atomic_claims[0].evidence_ids[0])!.quotation}]}}));
 const planned=vi.spyOn(planner,'planClaimQueries');const r=await verifyClaimWithRecovery({claim,inputLanguage:'en',admittedTextual:true,corpusSelection:'quran'});
 expect(r.verdict).toBe('supported_within_selected_corpus');expect(assess).toHaveBeenCalledTimes(2);expect(packets[0]).toEqual(packets[1]);expect(r.source_review_attempts).toHaveLength(2);expect((r.source_review_attempts![0].review as {explanation_preserved:boolean}).explanation_preserved).toBe(false);expect(planned).not.toHaveBeenCalled();expect(verifySeal(r)).toBe(true);
});
it('retains a relevant earlier passage through replacement search and reauthenticates its bytes',async()=>{
 const claim='Does the Quran mention water and a second unproved detail?';let calls=0;const packets:string[][]=[];
 vi.spyOn(provider,'assessClaim').mockImplementation(async(_c,_l,cards,model)=>{packets.push(cards.map(c=>c.locator));const a=assessment(claim,[cards[0].evidence_id]);a.all_material_claims_covered=false;a.atomic_claims[0].relation='partial';a.atomic_claims[0].qualifications_preserved=false;++calls;return {model:model!,usage:null,assessment:a};});
 vi.spyOn(provider,'reviewQualifiedExplanation').mockImplementation(async()=>({model:'gpt-5.6-terra',usage:null,review:{explanation_preserved:false,atoms:[]},raw_provider_review:{atoms:[]},unit_provenance:[]}));
 vi.spyOn(planner,'planClaimQueries').mockResolvedValue({arabic_terms:['المال'],english_terms:['wealth'],model:'gpt-5.6-luna',usage:null,planner_version:'fixture'});
 const r=await verifyClaimWithRecovery({claim,inputLanguage:'en',admittedTextual:true,corpusSelection:'quran'});expect(calls).toBe(2);expect(packets[1]).toContain(packets[0][0]);expect(r.evidence_items).toHaveLength(8);expect(r.retrieval_recovery?.first_record).toBeTruthy();expect(r.evidence_items.every(c=>c.integrity.passed)).toBe(true);expect(verifySeal(r)).toBe(true);
});

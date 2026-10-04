import {afterEach,expect,it,vi} from 'vitest';
import * as provider from '../src/lib/provider';
import * as hadith from '../src/lib/hadith';
import {verifyClaim,verifySeal} from '../src/lib/verification';
import {meaningPacket,clearPolarityMismatch} from '../src/lib/source-decision';
import {semanticSchema} from '../src/lib/contracts';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
it.each([
 ['Is liking nice clothes automatically arrogance in Islam?','Liking nice clothes is not automatically arrogance in Islam.'],
 ['Est-il permis de retenir une épouse après le divorce dans le but de lui faire du mal?','Il n’est pas permis de retenir une épouse après le divorce dans le but de lui faire du mal.'],
 ['Darf man eine Tat für morgen ohne diese Bedingung versprechen?','Man darf nicht eine Tat für morgen ohne diese Bedingung versprechen.'],
])('blocks a near-identical polarity reversal without sources: %s',(claim,text)=>{
 expect(clearPolarityMismatch(claim,[{text,material:true}])).toBe(true);
 expect(clearPolarityMismatch(claim,[{text:claim,material:true}])).toBe(false);
});
it('cannot approve truth, short statements, synonyms or differently scoped content',()=>{
 expect(clearPolarityMismatch('Is pork forbidden?',[{text:'Pork is not permitted.',material:true}])).toBe(false);
 expect(clearPolarityMismatch('Is liking nice clothes automatically arrogance in Islam?',[{text:'Liking nice clothes is automatically arrogance in Islam.',material:true}])).toBe(false);
 expect(clearPolarityMismatch('Is giving advice to strangers allowed without their consent?',[{text:'Advice to strangers is not appropriate in every circumstance.',material:true}])).toBe(false);
});
const captured={
  "original_claim": "Is liking nice clothes automatically arrogance in Islam?",
  "semantic_assessment": {
    "in_scope": true,
    "original_meaning_preserved": true,
    "atomic_claims": [
      {
        "id": "claim_1",
        "text": "Liking nice clothes is not automatically arrogance in Islam.",
        "material": true,
        "relation": "supports",
        "evidence_ids": [
          "hadeethenc-official-2026-10-04:en:6209"
        ],
        "direct": true,
        "context_fit": true,
        "negation_checked": true,
        "modality_checked": true,
        "qualifications_preserved": true,
        "attribution_matched": true,
        "scope_matched": true,
        "contradiction_basis": "none",
        "basis_evidence_id": null,
        "basis_quotation": null
      }
    ],
    "all_material_claims_covered": true,
    "summary_ar": "لا، وفق مجموعة المصادر المحددة، الإعجاب بحسن الملابس ليس كِبرًا تلقائيًا؛ فالبطاقة المعروضة في حديث en:6209 تميّز الكبر عن مجرد محبة المظهر الحسن، وتربطه بردّ الحق واحتقار الناس. وتنبّه بطاقة en:5363 إلى تجنب الإسراف والكِبر عند اللباس.",
    "summary_en": "No. Within the selected source collection, liking nice clothes is not automatically arrogance: the displayed Hadith card at en:6209 distinguishes arrogance from merely liking good-looking clothing and links it to rejecting truth and looking down on people. Card en:5363 also conditions wearing clothes on avoiding extravagance and pride.",
    "limitations": [
      "This is a textual assessment limited to the supplied selected source collection, not a personal ruling or fatwa.",
      "The conclusion concerns liking nice clothes itself; particular conduct, intent, extravagance, or treatment of others may require qualified scholarly review."
    ]
  },
  "assessment_attempts": [
    {
      "raw_assessment": {
        "in_scope": true,
        "original_meaning_preserved": true,
        "atomic_claims": [
          {
            "id": "c1",
            "text": "Liking nice clothes is automatically arrogance in Islam.",
            "material": true,
            "relation": "contradicts",
            "evidence_ids": [
              "hadeethenc-official-2026-10-04:en:6209"
            ],
            "direct": true,
            "context_fit": true,
            "negation_checked": true,
            "modality_checked": true,
            "qualifications_preserved": true,
            "attribution_matched": true,
            "scope_matched": true,
            "contradiction_basis": "explicit_negation_or_incompatible_statement",
            "basis_evidence_id": "hadeethenc-official-2026-10-04:en:6209",
            "basis_quotation": "‘Abdullāh ibn Mas‘ūd (may Allah be pleased with him) reported that the Prophet (may Allah's peace and blessings be upon him) said: \"Anyone has an atom's weight of arrogance in his heart will not enter Paradise.\" A man said:\" What if one likes his clothes and shoes to look good?\" He said: \"Verily, Allah is beautiful and He loves beauty. Arrogance is to reject the truth and look down on people.\""
          }
        ],
        "all_material_claims_covered": true,
        "summary_ar": "لا تدعم مجموعة المصادر المحددة أن محبة الملابس الحسنة تُعدّ كِبْرًا تلقائيًا؛ بل يميّز الحديث بين محبة المظهر الحسن وبين الكبر المرتبط برفض الحق واحتقار الناس. وهذا التقييم محصور في الحديث المحدد وما عرضه من تمييز.",
        "summary_en": "The selected source collection does not support the claim that liking nice clothes is automatically arrogance; the supplied hadith distinguishes appreciating good appearance from arrogance, which it describes in terms of rejecting truth and looking down on people. This assessment is limited to the supplied hadith record and selected corpus.",
        "limitations": [
          "This assessment is bounded by the supplied Quran and Hadith records; the Quran items provided here do not directly address this specific proposition.",
          "The publisher’s displayed grading and explanation are treated as metadata and are not independently authenticated here.",
          "A broader jurisprudential assessment may require review of additional qualified scholarship and evidence outside the supplied collection."
        ]
      }
    }
  ]
};
it('keeps the meaning-only packet free of sources, verdicts and model answers',()=>{
 const atom=semanticSchema.parse(captured.semantic_assessment).atomic_claims[0];
 expect(meaningPacket(captured.original_claim,[atom])).toEqual({original_claim:captured.original_claim,propositions_under_test:[{id:atom.id,text:atom.text}]});
});
it.each([[true,'reversed'],[false,'reversed'],[true,'qualification_disagreement'],[false,'qualification_disagreement']] as const)('recovers an already recorded faithful candidate only after both checks: %s %s',async (acceptsFirst,scenario)=>{
 vi.stubEnv('OPENAI_MODEL','gpt-5.6-luna');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 vi.spyOn(hadith,'retrieveHadith').mockReturnValue(hadith.loadHadith().records.filter(r=>r.language==='en'&&r.id==='6209'));
 const first=semanticSchema.parse(captured.assessment_attempts[0].raw_assessment);
 const reversed=semanticSchema.parse(captured.semantic_assessment);
 if(scenario==='qualification_disagreement'){
   reversed.atomic_claims=structuredClone(first.atomic_claims);
   reversed.atomic_claims[0].qualifications_preserved=false;
 }
 const assess=vi.spyOn(provider,'assessClaim').mockResolvedValueOnce({assessment:first,model:'gpt-5.6-luna',usage:null}).mockResolvedValueOnce({assessment:reversed,model:'gpt-5.6-terra',usage:null});
 const check=vi.spyOn(provider,'reviewPositiveEntailment').mockImplementation(async (_claim,a,cards)=>{
   const accepted=a.atomic_claims[0].relation==='contradicts'&&a.atomic_claims[0].qualifications_preserved&&acceptsFirst;
   return {model:'fixture',usage:null,meaning_check:{model:'fixture',usage:null,review:{faithful:accepted?'yes':'no'}},review:{explanation_preserved:true,atoms:a.atomic_claims.map(x=>({atom_id:x.id,entails:accepted?'yes':'no',attribution_preserved:accepted,qualifications_preserved:accepted,evidence_id:accepted?x.evidence_ids[0]:null,context_locator:null,basis_quotation:accepted?cards.find(c=>c.evidence_id===x.evidence_ids[0])!.quotation:null}))}};
 });
 const r=await verifyClaim({claim:captured.original_claim,inputLanguage:'en',corpusSelection:'hadith',admittedTextual:true});
 expect(assess).toHaveBeenCalledTimes(2);expect(check).toHaveBeenCalledTimes(scenario==='reversed'?2:1);
 expect(r.verdict).toBe(acceptsFirst?'conflicting_within_selected_corpus':'not_evaluated');
 expect(r.assessment_attempts?.[1].raw_assessment).toEqual(reversed);
 expect(r.source_review_attempts).toHaveLength(scenario==='reversed'?2:1);
 expect(r.source_review_attempts?.[0].input_assessment).toMatchObject({atomic_claims:[{text:captured.original_claim}]});
 expect(r.meaning_review_attempts?.[0].review).toEqual({faithful:scenario==='reversed'||!acceptsFirst?'no':'yes'});
 expect(verifySeal(r)).toBe(true);
});

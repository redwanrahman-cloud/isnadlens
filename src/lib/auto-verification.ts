import {randomUUID} from 'node:crypto';
import {identifySource, type SourceIdentification} from './source-identification';
import {scopeGate} from './policy';
import {sealRecord,verifyClaim} from './verification';
import {PROMPT_VERSION,SCHEMA_VERSION} from './provider';
import type {VerificationRecord} from './contracts';

function unidentifiedRecord(claim:string,inputLanguage:'ar'|'en',identification:SourceIdentification):VerificationRecord {
  const ambiguous=identification.status==='ambiguous';
  return sealRecord({
    record_id:randomUUID(),original_claim:claim,verdict:'not_evaluated',reason_codes:[ambiguous?'SOURCE_IDENTIFICATION_AMBIGUOUS':'SOURCE_NOT_IDENTIFIED'],
    summary_ar:ambiguous?'لم يُحدد مصدر واحد بوضوح. اختر القرآن أو الحديث لفحص الادعاء.':'لم يُعثر على تطابق مباشر يحدد المصدر في المجموعات المتاحة. أضف نص الاقتباس أو اختر المصدر يدوياً.',
    summary_en:ambiguous?'A single source could not be identified clearly. Select Quran or Hadith to examine the claim.':'No direct match identified the source in the available collections. Add the quotation or select the source manually.',
    evidence_items:[],limitations:['Automatic identification covers admitted editions only; an unmatched quotation is not proof of absence or a weak hadith.','Source identification does not establish semantic support or independently grade a hadith.'],
    created_at:new Date().toISOString(),model:'none',technical_verification_status:'not_run',human_scholarly_status:'not_reviewed',linguistic_review_status:'not_reviewed',
    input_language:inputLanguage,corpus_manifest:null,corpus_sha256:null,retrieval_ids:[],semantic_assessment:null,
    prompt_version:PROMPT_VERSION,schema_version:SCHEMA_VERSION,usage:null,corpus_selection:identification.corpus??'quran',source_identification:identification,
  });
}
export async function verifyAutoClaim({claim,inputLanguage}:{claim:string;inputLanguage:'ar'|'en'}):Promise<VerificationRecord> {
  const blocked=scopeGate(claim);
  // Personal/privacy/injection refusals must not search sources or reach a provider.
  if(blocked&&blocked!=='OUTSIDE_SUPPORTED_CLAIM_SCOPE')return verifyClaim({claim,inputLanguage,corpusSelection:'quran'});
  if(blocked==='OUTSIDE_SUPPORTED_CLAIM_SCOPE'&&/\b(weather|forecast|temperature|recipe|stock price|exchange rate|football score|how are you|hello|write (?:me )?(?:code|a poem)|tell (?:me )?a joke)\b|الطقس|طقس|درجة الحرارة|كيف حالك|مرحبا|وصفة طبخ|سعر الصرف|نتيجة المباراة/i.test(claim))return verifyClaim({claim,inputLanguage,corpusSelection:'quran'});
  const identification=identifySource(claim,inputLanguage);
  if(identification.status!=='identified'||!identification.corpus) {
    if(blocked==='OUTSIDE_SUPPORTED_CLAIM_SCOPE')return verifyClaim({claim,inputLanguage,corpusSelection:'quran'});
    return unidentifiedRecord(claim,inputLanguage,identification);
  }
  return verifyClaim({claim,inputLanguage,corpusSelection:identification.corpus,sourceIdentification:identification});
}

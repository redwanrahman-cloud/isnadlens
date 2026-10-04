import {identifySource} from './source-identification';
import {scopeGate} from './policy';
import {verifyClaim} from './verification';
import type {VerificationRecord} from './contracts';

/** Identify quotations when possible; ordinary claims search both source families. */
export async function verifyAutoClaim({claim,inputLanguage}:{claim:string;inputLanguage:'ar'|'en'}):Promise<VerificationRecord> {
  const blocked=scopeGate(claim);
  if(blocked&&blocked!=='OUTSIDE_SUPPORTED_CLAIM_SCOPE')return verifyClaim({claim,inputLanguage,corpusSelection:'quran'});
  if(blocked==='OUTSIDE_SUPPORTED_CLAIM_SCOPE'&&/\b(weather|forecast|temperature|recipe|stock price|exchange rate|football score|how are you|hello|write (?:me )?(?:code|a poem)|tell (?:me )?a joke)\b|الطقس|طقس|درجة الحرارة|كيف حالك|مرحبا|وصفة طبخ|سعر الصرف|نتيجة المباراة/i.test(claim))return verifyClaim({claim,inputLanguage,corpusSelection:'quran'});
  const identification=identifySource(claim,inputLanguage);
  const directMatch=['exact_quotation','normalized_quotation'].includes(identification.method)&&identification.candidate_locators.length>0;
  if(blocked==='OUTSIDE_SUPPORTED_CLAIM_SCOPE'&&!directMatch)return verifyClaim({claim,inputLanguage,corpusSelection:'quran'});
  if(identification.status==='identified'&&identification.corpus) {
    return verifyClaim({claim,inputLanguage,corpusSelection:identification.corpus,sourceIdentification:identification,useQueryPlanner:!directMatch});
  }
  // Missing literal matches do not establish absence or falsity of a paraphrase.
  return verifyClaim({claim,inputLanguage,corpusSelection:'both',useQueryPlanner:!directMatch,
    ...(identification.status==='ambiguous'?{sourceIdentification:identification}:{})});
}

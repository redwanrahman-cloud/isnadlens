import type { SemanticAssessment, VerificationRecord } from './contracts';
import { asciiDigits } from './citations';

/** Public source questions can mention sensitive subjects without describing a private case. */
export function publicEvidenceRequest(claim: string): boolean {
  return /\b(quran|qur'an|koran|hadith|hadeeth|islam|islamic|sunnah)\b|قرآن|القران|حديث|الإسلام|الاسلام|السنة|কুরআন|কোরআন|হাদিস|इस्लाम|कुरान|قرآن|حدیث/i.test(claim)
    && !/\b(my (?:illness|condition|wife|husband|pregnancy|debt|salary|income|account)|i (?:have|owe|suffer)|i am (?:ill|sick|pregnant|diabetic)|patient|diagnos\w*|help me|how to (?:kill|attack)|weapon|target|plan(?:ning)? violence)\b|زوجتي|حالتي|مرضي|حامل أنا|أريد قتل|اريد قتل|سلاح|مريض اسمه/i.test(claim)
    && !/\b(?:[A-Z][a-z]+) (?:has|is suffering|lives at|earns|owes)\b/.test(claim.replace(/\b(?:Quran|Hadith|Islam|Allah|God)\b/g, 'source'));
}
function personalRulingRequest(claim: string): boolean {
  if (/\b(?:can i|should i|may i|i want to).{0,30}(?:kill|attack|hurt)\b/i.test(claim)) return true;
  // Pronouns are normal in learning questions. Refer actual personal circumstances,
  // not generic "Can I trade during Hajj?" or "Which shoe should I put on first?".
  if (!/\b(my (?:illness|condition|wife|husband|pregnancy|debt|salary|income|account|bank)|i (?:have|owe|suffer)|i am (?:ill|sick|pregnant|diabetic)|(?:can i|should i|am i|for me).{0,70}(?:illness|sick|medication|doctor|divorce|stop fasting|break.{0,12}fast))\b|زوجتي|حالتي|مرضي|علي كفارة|حكم حالتي|أنا حامل|انا حامل|je suis enceinte|mi esposa|mon épouse|meine frau|istri saya|আমার.{0,25}(?:রোগ|স্ত্রী|ঋণ)|मेरी.{0,25}(?:बीमारी|पत्नी)|میری.{0,25}(?:بیماری|بیوی)/i.test(claim)) return false;
  // First-person learning/verification language alone is not a case-specific ruling.
  const learningRequest = /\b(?:can i|should i|i am|my)\s+(?:check|verify|understand|learn|ask|understanding|interpretation|reading|confused about|trying to understand)\b/i.test(claim)
    && publicEvidenceRequest(claim);
  const remaining = learningRequest ? claim.replace(/\b(?:can i|should i|i am|my)\s+(?:check|verify|understand|learn|ask|understanding|interpretation|reading|confused about|trying to understand)\b/ig, '') : claim;
  return /\b(my|i am|i have|am i|should i|can i|is it permissible for me|puedo yo|debo yo|mi esposa|je peux|puis-je|dois-je|mon épouse|darf ich|soll ich|meine frau|bolehkah saya|istri saya)\b|هل يجوز لي|علي كفارة|زوجتي|أنا|حكم حالتي|আমার|আমি কি|আমাকে|मेरी|मेरा|क्या मैं|مجھے|میری|میرا|کیا میں/i.test(remaining);
}

function publicFastingQualification(claim: string): boolean {
  // A public source description of the fasting exception is not a patient's health history.
  return /quran|qur'an|koran|cor[aá]n|coran|قرآن|القران|কোরআন|কুরআন|कुरान|क़ुरआन/i.test(claim)
    && /fast|ramadan|je[uû]ne|ayuno|puasa|صيام|الصيام|رمضان|روزہ|রোজা|রোজ़া|रोज़ा|उपवास/i.test(claim)
    && /illness|sick|journey|travel|malad|voyage|enferm|viaje|krank|reise|sakit|perjalanan|مرض|سفر|بیمار|অসুস্থ|ভ্রমণ|बीमार|यात्रा/i.test(claim)
    && /exception|exempt|qualif|make.up|mention|describ|says|استثناء|يذكر|قضاء|ذکر|রেহাই|উল্লেখ|अपवाद|छूट|excep|dispens|erw[aä]hn/i.test(claim);
}
function publicDebtDocumentation(claim: string): boolean {
  return /\b(quran|qur'an|koran|hadith|hadeeth)\b|قرآن|القران|حديث/i.test(claim)
    && /\b(debt|debts)\b|الدين|ديون/i.test(claim)
    && /\b(record|recording|write|writing|document|documenting|documentation|contracted|fixed period|fixed term)\b|كتابة|كتابه|اكتب|توثيق|أجل مسمى|اجل مسمى/i.test(claim);
}

/** Native screening precedes any translation/detection request; never rewrites the user input. */
export function nativeSafetyGate(claim: string): string | null {
  if (typeof claim !== 'string' || claim.trim().length < 5 || claim.length > 1200) return 'INPUT_INVALID';
  if (/ignore.{0,30}(instructions|rules)|system prompt|developer message|تجاهل.{0,30}(تعليمات|قواعد)|ignora.{0,30}instru|ignorez.{0,30}instructions|ignoriere.{0,30}(anweisung|regel)|abaikan.{0,30}(instruksi|aturan)|নির্দেশ.{0,20}উপেক্ষা|निर्देश.{0,20}अनदेखा|ہدایات.{0,20}نظر انداز/i.test(claim)) return 'INSTRUCTION_INJECTION';
  const numbers = asciiDigits(claim).replace(/[০-৯]/g, d => String(d.charCodeAt(0) - 0x09e6)).replace(/[०-९]/g, d => String(d.charCodeAt(0) - 0x0966));
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s-]{8,}/i.test(numbers)) return 'PRIVATE_DATA_REFERRAL';
  if (personalRulingRequest(claim)) return 'PERSONAL_RULING_REFERRAL';
  const healthMatch = /\b(patient|diabet\w*|cancer|disease|illness|pregnan\w*|medication|bank account|credit card|passport|ssn|enfermedad|embaraz\w*|maladie|enceinte|krank\w*|schwanger\w*|penyakit|hamil)\b|مرض|مريض|سكري|سرطان|حامل|حساب بنكي|রোগ|গর্ভবতী|ক্যান্সার|बीमारी|गर्भवती|कैंसर|بیمار|حاملہ/i.test(claim);
  if (healthMatch && /\b(patient|diabet\w*|cancer|medication|bank account|credit card|passport|ssn)\b|سكري|سرطان|حساب بنكي|ক্যান্সার|कैंसर/i.test(claim) && !publicEvidenceRequest(claim)) return 'PRIVATE_OR_SENSITIVE_FACTS_REFERRAL';
  const namedFact = /\b([A-Z][a-z]+)\s+(has|is suffering|lives at|earns|owes)\b/.exec(claim);
  if (namedFact && !['Intention', 'Prayer', 'Fasting', 'Charity', 'Religion', 'Islam', 'Quran', 'Hadith', 'Ramadan', 'God', 'Allah', 'Creation', 'Water', 'Life', 'Mercy', 'Justice'].includes(namedFact[1])) return 'PERSONAL_FACTS_REFERRAL';
  if (/\b(kafir|apostate|terrorist|sect|political)\w*|تكفير|مرتد|طائفة/i.test(claim) || /\bsuicide\b|انتحار|আত্মহত্যা|आत्महत्या|خودکشی/i.test(claim) && !publicEvidenceRequest(claim)) return 'SENSITIVE_SCOPE_REFERRAL';
  if (claim.replace(/[\p{Script=Latin}\p{Script=Arabic}\p{Script=Bengali}\p{Script=Devanagari}\u0640\p{M}\p{N}\p{P}\p{S}\p{Z}\s]/gu, '').length) return 'INPUT_LANGUAGE_NOT_SUPPORTED';
  return null;
}

export function scopeGate(claim: string, admittedTextual = false): string | null {
  if (claim.trim().length < 5 || claim.length > 1200) return 'INPUT_INVALID';
  if (/ignore.{0,30}(instructions|rules)|system prompt|developer message|تجاهل.{0,30}(تعليمات|قواعد)/i.test(claim)) return 'INSTRUCTION_INJECTION';
  // Everyday/live-information requests stay outside textual verification even
  // when they happen to mention a religious topic or place.
  const textAttribution = /\b(quran|qur'an|koran|hadith|hadeeth|prophet said|muhammad said)\b|قرآن|القران|حديث|قال النبي|قال رسول/i.test(claim);
  if (/\b(?:how are you|what are you up to|hello|write (?:me )?(?:code|a poem)|(?:build|develop|create) (?:me )?(?:an? )?(?:app|application|website)|tell (?:me )?a joke)\b|كيف حالك|اكتب.*كود/i.test(claim)) return 'OUTSIDE_SUPPORTED_CLAIM_SCOPE';
  if (!textAttribution && /\b(weather|forecast|temperature|stock price|exchange rate|football score|write (?:me )?(?:code|a poem)|tell (?:me )?a joke|recipe)\b|الطقس|طقس|درجة الحرارة|سعر الصرف|نتيجة المباراة|وصفة طبخ|اكتب.*كود|قل.*نكتة/i.test(claim)) return 'OUTSIDE_SUPPORTED_CLAIM_SCOPE';
  if (personalRulingRequest(claim)) return 'PERSONAL_RULING_REFERRAL';
  const nativeBlocked = nativeSafetyGate(claim); if (nativeBlocked) return nativeBlocked;
  const publicViolenceDescription = textAttribution
    && /\b(say|says|describe|describes|mention|mentions|warn|warns|forbid|forbids|prohibit|prohibits|recount|recounts)\b|يقول|يذكر|يصف|يحذر|ينهى|يحرم|يتوعد/i.test(claim)
    && !/\b(how to|instructions|methods|target|weapon|attack|plan|planning|want to|intend to|help me)\b|كيف|طريقة|سلاح|استهدف|أخطط|اخطط|أريد|اريد|ساعدني/i.test(claim)
    && !/\bkill(?:ing)?\s+(?:[A-Z][a-z]+|you|him|her|them)\b/.test(claim);
  if (/\b(kafir|apostate|terrorist|sect|political)\w*|تكفير|كافر|مرتد|طائفة/i.test(claim)
    || /\b(suicide|medical|diagnos)\w*|انتحار/i.test(claim) && !publicEvidenceRequest(claim)
    || /\b(kill)\w*|قتل/i.test(claim) && !publicViolenceDescription) return 'SENSITIVE_SCOPE_REFERRAL';
  if (/\b(patient|diabet\w*|cancer|disease|illness|pregnan\w*|doctor|medicine|medication|salary|income|bank account|credit card|passport|ssn)\b|مريض|سكري|سرطان|مرض|حامل|دواء|طبيب|راتب|دخل شخصي|حساب بنكي|رقم الهوية|جواز/i.test(claim)
    && !admittedTextual && !publicEvidenceRequest(claim) && (!publicFastingQualification(claim) || /patient|diabet|cancer|pregnan|doctor|medicine|medication|salary|income|bank account|credit card|passport|ssn|سكري|سرطان|حامل|دواء|طبيب|راتب|دخل شخصي|حساب بنكي|رقم الهوية|جواز/i.test(claim))) return 'PRIVATE_OR_SENSITIVE_FACTS_REFERRAL';
  if (!admittedTextual && /\b(debt|debts)\b|ديون/i.test(claim) && !publicEvidenceRequest(claim) && !publicDebtDocumentation(claim)) return 'PRIVATE_OR_SENSITIVE_FACTS_REFERRAL';
  if (/\b(my|his|her|their|patient'?s|[A-Z][a-z]+'s)\s+(home\s+)?(address|phone number|telephone number)\b|عنواني|عنوانه|عنوانها|رقم هاتفي|رقم هاتفه|رقم هاتفها/i.test(claim)) return 'PRIVATE_DATA_REFERRAL';
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s-]{8,}/i.test(asciiDigits(claim))) return 'PRIVATE_DATA_REFERRAL';
  if (/\b(mr|mrs|ms|dr)\.\s+[A-Z]|فلان|فلانة|يعاني|تسكن|يسكن/.test(claim)) return 'PERSONAL_FACTS_REFERRAL';
  const namedFact = /\b([A-Z][a-z]+)\s+(has|is suffering|lives at|earns|owes)\b/.exec(claim);
  if (namedFact && !['Intention', 'Prayer', 'Fasting', 'Charity', 'Religion', 'Islam', 'Quran', 'God', 'Allah', 'Creation', 'Water', 'Life', 'Mercy', 'Justice'].includes(namedFact[1])) return 'PERSONAL_FACTS_REFERRAL';
  const nonDomain = claim.replace(/[\p{Script=Latin}\p{Script=Arabic}\u0640\p{M}\p{N}\p{P}\p{S}\p{Z}\s]/gu, '');
  if (nonDomain.length) return 'INPUT_LANGUAGE_NOT_SUPPORTED';
  // Only the server's validated high-confidence textual routing can admit a
  // domain without a keyword. This admits searching, never an answer or verdict.
  if (admittedTextual) return null;
  // Islamic normative labels establish a textual-claim domain, not a verdict.
  // Ordinary food questions without such context remain outside this verifier.
  const generalIslamicRule = /\b(halal|haram)\b|حلال|حرام/i.test(claim)
    || (/\b(pork|pig|pigs|swine)\b|خنزير|خنازير/i.test(claim) && /\b(forbidden|prohibited|permitted|permissible|lawful|unlawful|islam|muslim|religion)\b|محرم|محرّم|يجوز|الإسلام|الاسلام|مسلم|الدين/i.test(claim));
  if (generalIslamicRule) return null;
  const ethicalSubject = /\b(lying|lies|lie|backbiting|gossip|honesty|honest|truthful|stealing|theft|cheating|envy|arrogance|kindness|forgiveness|forgive|orphans|neighbours|neighbors|wudu|ablution|marriage|divorce|modesty|sadaqah|sabr|shirk|tawhid|dua|supplication|smiling|smile)\b|الكذب|كذب|الغيبة|غيبة|نميمة|أمانة|امانة|صدق|السرقة|سرقة|غش|الحسد|التكبر|يتيم|الجار|الوضوء|وضوء|الزواج|طلاق|دعاء|الشرك|التوحيد|تبسم|ابتسام/i.test(claim);
  if (ethicalSubject && /\b(forbidden|prohibited|permitted|permissible|required|obligatory|recommended|sin|virtue|reward|islam|muslim|religion|should|must)\b|حلال|حرام|واجب|محرم|يجوز|الإسلام|الاسلام|مسلم|الدين/i.test(claim)) return null;
  if (!/\b(quran|qur'an|koran|allah|islam|muslim|prayer|pray|fasting|ramadan|zakat|hajj|umrah|charity|religion|god|creation|compulsion|usury|gambling|alcohol|inheritance|parents|mercy|water|life|hadith|hadeeth|prophet|muhammad|intentions|intention)\b|قرآن|القران|الله|الإسلام|الاسلام|مسلم|الصلاة|صلاة|الصيام|صيام|رمضان|زكاة|الزكاة|الحج|حج|العمرة|الدين|إكراه|اكراه|خلق|الماء|ماء|حي|الربا|الخمر|الوالدين|حديث|النبي|رسول|نيات|النيات|نية|النية|(?:^|[^\d])\d{1,3}\s*:\s*\d{1,3}(?!\d)/i.test(claim)) return 'OUTSIDE_SUPPORTED_CLAIM_SCOPE';
  return null;
}
export function decideVerdict(assessment: SemanticAssessment, evidenceIds: Set<string>): VerificationRecord['verdict'] {
  if (!assessment.in_scope || !assessment.original_meaning_preserved) return 'not_evaluated';
  const atoms = assessment.atomic_claims.filter(a => a.material);
  if (!atoms.length || new Set(assessment.atomic_claims.map(a => a.id)).size !== assessment.atomic_claims.length) return 'insufficient_within_selected_corpus';
  const valid = (atom: typeof atoms[number]) => atom.direct && atom.context_fit && atom.negation_checked && atom.modality_checked && atom.qualifications_preserved && atom.attribution_matched && atom.scope_matched && atom.evidence_ids.length > 0 && atom.evidence_ids.every(id => evidenceIds.has(id));
  if (atoms.some(a => a.relation === 'contradicts' && valid(a) && a.contradiction_basis === 'explicit_negation_or_incompatible_statement' && a.basis_evidence_id && a.evidence_ids.includes(a.basis_evidence_id) && a.basis_quotation)) return 'conflicting_within_selected_corpus';
  if (assessment.all_material_claims_covered && atoms.every(a => a.relation === 'supports' && valid(a))) return 'supported_within_selected_corpus';
  return 'insufficient_within_selected_corpus';
}

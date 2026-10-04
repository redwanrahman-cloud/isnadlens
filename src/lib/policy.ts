import type { SemanticAssessment, VerificationRecord } from './contracts';
import { asciiDigits } from './citations';

function publicFastingQualification(claim: string): boolean {
  // A public source description of the fasting exception is not a patient's health history.
  return /quran|qur'an|koran|cor[aá]n|coran|قرآن|القران|কোরআন|কুরআন|कुरान|क़ुरआन/i.test(claim)
    && /fast|ramadan|je[uû]ne|ayuno|puasa|صيام|الصيام|رمضان|روزہ|রোজা|রোজ़া|रोज़ा|उपवास/i.test(claim)
    && /illness|sick|journey|travel|malad|voyage|enferm|viaje|krank|reise|sakit|perjalanan|مرض|سفر|بیمار|অসুস্থ|ভ্রমণ|बीमार|यात्रा/i.test(claim)
    && /exception|exempt|qualif|make.up|mention|describ|says|استثناء|يذكر|قضاء|ذکر|রেহাই|উল্লেখ|अपवाद|छूट|excep|dispens|erw[aä]hn/i.test(claim);
}

/** Native screening precedes any translation/detection request; never rewrites the user input. */
export function nativeSafetyGate(claim: string): string | null {
  if (typeof claim !== 'string' || claim.trim().length < 5 || claim.length > 1200) return 'INPUT_INVALID';
  if (/ignore.{0,30}(instructions|rules)|system prompt|developer message|تجاهل.{0,30}(تعليمات|قواعد)|ignora.{0,30}instru|ignorez.{0,30}instructions|ignoriere.{0,30}(anweisung|regel)|abaikan.{0,30}(instruksi|aturan)|নির্দেশ.{0,20}উপেক্ষা|निर्देश.{0,20}अनदेखा|ہدایات.{0,20}نظر انداز/i.test(claim)) return 'INSTRUCTION_INJECTION';
  const numbers = asciiDigits(claim).replace(/[০-৯]/g, d => String(d.charCodeAt(0) - 0x09e6)).replace(/[०-९]/g, d => String(d.charCodeAt(0) - 0x0966));
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s-]{8,}/i.test(numbers)) return 'PRIVATE_DATA_REFERRAL';
  if (/\b(my|i am|i have|am i|should i|can i|is it permissible for me|puedo yo|debo yo|mi esposa|je peux|puis-je|dois-je|mon épouse|darf ich|soll ich|meine frau|bolehkah saya|istri saya)\b|هل يجوز لي|زوجتي|حكم حالتي|আমার|আমি কি|আমাকে|मेरी|मेरा|क्या मैं|مجھے|میری|میرا|کیا میں/i.test(claim)) return 'PERSONAL_RULING_REFERRAL';
  const healthMatch = /\b(patient|diabet\w*|cancer|disease|illness|pregnan\w*|medication|bank account|credit card|passport|ssn|enfermedad|embaraz\w*|maladie|enceinte|krank\w*|schwanger\w*|penyakit|hamil)\b|مرض|مريض|سكري|سرطان|حامل|حساب بنكي|রোগ|গর্ভবতী|ক্যান্সার|बीमारी|गर्भवती|कैंसर|بیمار|حاملہ/i.test(claim);
  const privateHealth = /patient|diabet|cancer|pregnan|medication|bank account|credit card|passport|ssn|embaraz|enceinte|schwanger|hamil|سكري|سرطان|حامل|حساب بنكي|গর্ভবতী|ক্যান্সার|गर्भवती|कैंसर|حاملہ/i.test(claim);
  if (healthMatch && (!publicFastingQualification(claim) || privateHealth)) return 'PRIVATE_OR_SENSITIVE_FACTS_REFERRAL';
  if (/\b(kafir|apostate|terrorist|suicide|sect|political)\w*|تكفير|مرتد|انتحار|طائفة|আত্মহত্যা|आत्महत्या|خودکشی/i.test(claim)) return 'SENSITIVE_SCOPE_REFERRAL';
  if (claim.replace(/[\p{Script=Latin}\p{Script=Arabic}\p{Script=Bengali}\p{Script=Devanagari}\u0640\p{M}\p{N}\p{P}\p{S}\p{Z}\s]/gu, '').length) return 'INPUT_LANGUAGE_NOT_SUPPORTED';
  return null;
}

export function scopeGate(claim: string): string | null {
  if (claim.trim().length < 5 || claim.length > 1200) return 'INPUT_INVALID';
  if (/ignore.{0,30}(instructions|rules)|system prompt|developer message|تجاهل.{0,30}(تعليمات|قواعد)/i.test(claim)) return 'INSTRUCTION_INJECTION';
  // Everyday/live-information requests stay outside textual verification even
  // when they happen to mention a religious topic or place.
  const textAttribution = /\b(quran|qur'an|koran|hadith|hadeeth|prophet said|muhammad said)\b|قرآن|القران|حديث|قال النبي|قال رسول/i.test(claim);
  if (!textAttribution && /\b(weather|forecast|temperature|stock price|exchange rate|football score|write (?:me )?(?:code|a poem)|tell (?:me )?a joke|recipe)\b|الطقس|طقس|درجة الحرارة|سعر الصرف|نتيجة المباراة|وصفة طبخ|اكتب.*كود|قل.*نكتة/i.test(claim)) return 'OUTSIDE_SUPPORTED_CLAIM_SCOPE';
  if (/\b(my|i am|i have|am i|should i|can i|is it permissible for me)\b|هل يجوز لي|علي كفارة|زوجتي|أنا|حكم حالتي/i.test(claim)) return 'PERSONAL_RULING_REFERRAL';
  if (/\b(kafir|apostate|kill|terrorist|suicide|medical|diagnos|sect|political)\w*|تكفير|كافر|مرتد|انتحار|قتل|طائفة/i.test(claim)) return 'SENSITIVE_SCOPE_REFERRAL';
  if (/\b(patient|diabet\w*|cancer|disease|illness|pregnan\w*|doctor|medicine|medication|salary|income|debt|bank account|credit card|passport|ssn)\b|مريض|سكري|سرطان|مرض|حامل|دواء|طبيب|راتب|دخل شخصي|ديون|حساب بنكي|رقم الهوية|جواز/i.test(claim)
    && (!publicFastingQualification(claim) || /patient|diabet|cancer|pregnan|doctor|medicine|medication|salary|income|debt|bank account|credit card|passport|ssn|سكري|سرطان|حامل|دواء|طبيب|راتب|دخل شخصي|ديون|حساب بنكي|رقم الهوية|جواز/i.test(claim))) return 'PRIVATE_OR_SENSITIVE_FACTS_REFERRAL';
  if (/\b(my|his|her|their|patient'?s|[A-Z][a-z]+'s)\s+(home\s+)?(address|phone number|telephone number)\b|عنواني|عنوانه|عنوانها|رقم هاتفي|رقم هاتفه|رقم هاتفها/i.test(claim)) return 'PRIVATE_DATA_REFERRAL';
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s-]{8,}/i.test(asciiDigits(claim))) return 'PRIVATE_DATA_REFERRAL';
  if (/\b(mr|mrs|ms|dr)\.\s+[A-Z]|فلان|فلانة|يعاني|تسكن|يسكن/.test(claim)) return 'PERSONAL_FACTS_REFERRAL';
  const namedFact = /\b([A-Z][a-z]+)\s+(has|is suffering|lives at|earns|owes)\b/.exec(claim);
  if (namedFact && !['Intention', 'Prayer', 'Fasting', 'Charity', 'Religion', 'Islam', 'Quran', 'God', 'Allah', 'Creation', 'Water', 'Life', 'Mercy', 'Justice'].includes(namedFact[1])) return 'PERSONAL_FACTS_REFERRAL';
  const nonDomain = claim.replace(/[\p{Script=Latin}\p{Script=Arabic}\u0640\p{M}\p{N}\p{P}\p{S}\p{Z}\s]/gu, '');
  if (nonDomain.length) return 'INPUT_LANGUAGE_NOT_SUPPORTED';
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

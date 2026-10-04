import type { SemanticAssessment, VerificationRecord } from './contracts';
import { asciiDigits } from './citations';

export function scopeGate(claim: string): string | null {
  if (claim.trim().length < 5 || claim.length > 1200) return 'INPUT_INVALID';
  if (/ignore.{0,30}(instructions|rules)|system prompt|developer message|تجاهل.{0,30}(تعليمات|قواعد)/i.test(claim)) return 'INSTRUCTION_INJECTION';
  if (/\b(my|i am|i have|am i|should i|can i|is it permissible for me)\b|هل يجوز لي|علي كفارة|زوجتي|أنا|حكم حالتي/i.test(claim)) return 'PERSONAL_RULING_REFERRAL';
  if (/\b(kafir|apostate|kill|terrorist|suicide|medical|diagnos|sect|political)\w*|تكفير|كافر|مرتد|انتحار|قتل|طائفة/i.test(claim)) return 'SENSITIVE_SCOPE_REFERRAL';
  if (/\b(patient|diabet\w*|cancer|disease|illness|pregnan\w*|doctor|medicine|medication|salary|income|debt|bank account|credit card|passport|ssn)\b|مريض|سكري|سرطان|مرض|حامل|دواء|طبيب|راتب|دخل شخصي|ديون|حساب بنكي|رقم الهوية|جواز/i.test(claim)) return 'PRIVATE_OR_SENSITIVE_FACTS_REFERRAL';
  if (/\b(my|his|her|their|patient'?s|[A-Z][a-z]+'s)\s+(home\s+)?(address|phone number|telephone number)\b|عنواني|عنوانه|عنوانها|رقم هاتفي|رقم هاتفه|رقم هاتفها/i.test(claim)) return 'PRIVATE_DATA_REFERRAL';
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s-]{8,}/i.test(asciiDigits(claim))) return 'PRIVATE_DATA_REFERRAL';
  if (/\b(mr|mrs|ms|dr)\.\s+[A-Z]|فلان|فلانة|يعاني|تسكن|يسكن/.test(claim)) return 'PERSONAL_FACTS_REFERRAL';
  const namedFact = /\b([A-Z][a-z]+)\s+(has|is suffering|lives at|earns|owes)\b/.exec(claim);
  if (namedFact && !['Intention', 'Prayer', 'Fasting', 'Charity', 'Religion', 'Islam', 'Quran', 'God', 'Allah', 'Creation', 'Water', 'Life', 'Mercy', 'Justice'].includes(namedFact[1])) return 'PERSONAL_FACTS_REFERRAL';
  const nonDomain = claim.replace(/[\p{Script=Latin}\p{Script=Arabic}\p{M}\p{N}\p{P}\p{S}\p{Z}\s]/gu, '');
  if (nonDomain.length) return 'INPUT_LANGUAGE_NOT_SUPPORTED';
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

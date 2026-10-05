import type { DisplayLanguage } from './display-copy';

type ClarificationRecord = {
  original_claim: string;
  verdict: string;
  reason_codes: string[];
  language_intake?: {
    clarification_proposal?: string | null;
    detected_language: DisplayLanguage | null;
    confidence: string;
    scope_category?: string;
  };
};

/** A size limit on wording changes, not a semantic judgment or an admission gate. */
export function closeWordingRepair(original: string, proposed: string): boolean {
  const normalize = (text: string) => [...text.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}\p{M}\s]/gu, '').replace(/\s+/gu, ' ').trim()];
  if (!original.trim() || !proposed.trim() || original.length > 1200 || proposed.length > 1200) return false;
  const a = normalize(original), b = normalize(proposed);
  const limit = Math.max(2, Math.floor(a.length * 0.15));
  if (Math.abs(a.length - b.length) > limit) return false;
  let row = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j-1] + 1, row[j] + 1, row[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    row = next;
  }
  return row[b.length] > 0 && row[b.length] <= limit;
}

export function needsClarification(record: ClarificationRecord | null): boolean {
  return record?.verdict === 'not_evaluated' && record.reason_codes.includes('CLAIM_CLARIFICATION_REQUIRED');
}

/** A proposal is user-editable input, never an admitted claim or source evidence. */
export function clarificationProposal(record: ClarificationRecord | null): { question: string; language: DisplayLanguage } | null {
  const intake = record?.language_intake;
  const question = intake?.clarification_proposal?.trim();
  if (!record || !needsClarification(record) || intake?.scope_category !== 'clarification' || intake.confidence !== 'high' || !intake.detected_language || !question || !closeWordingRepair(record.original_claim, question)) return null;
  return { question, language: intake.detected_language };
}

export const clarificationCopy: Record<DisplayLanguage, { badge: string; title: string; missing: string; note: string; yes: string; no: string; edit: string }> = {
  en: { badge: 'Quick clarification', title: 'Is this what you mean?', missing: 'A little more detail will help', note: 'Confirm this wording to check its sources, or edit your original question.', yes: 'Yes, check this', no: 'No, let me edit', edit: 'Edit my question' },
  ar: { badge: 'توضيح سريع', title: 'هل هذا ما تقصده؟', missing: 'نحتاج إلى توضيح بسيط', note: 'أكّد هذه الصياغة للتحقق من مصادرها، أو عدّل سؤالك الأصلي.', yes: 'نعم، تحقّق من هذا', no: 'لا، أريد التعديل', edit: 'عدّل سؤالي' },
  bn: { badge: 'একটু স্পষ্ট করুন', title: 'আপনি কি এটাই বোঝাতে চেয়েছেন?', missing: 'আরও একটু বিস্তারিত বলুন', note: 'উৎস যাচাই করতে এই প্রশ্নটি নিশ্চিত করুন, অথবা মূল প্রশ্নটি সম্পাদনা করুন।', yes: 'হ্যাঁ, এটি যাচাই করুন', no: 'না, সম্পাদনা করব', edit: 'আমার প্রশ্ন সম্পাদনা করুন' },
  hi: { badge: 'एक छोटा स्पष्टीकरण', title: 'क्या आपका यही मतलब है?', missing: 'थोड़ा और विवरण दें', note: 'स्रोत जाँचने के लिए इस प्रश्न की पुष्टि करें, या अपना मूल प्रश्न बदलें।', yes: 'हाँ, इसे जाँचें', no: 'नहीं, मैं बदलूँगा', edit: 'मेरा प्रश्न बदलें' },
  ur: { badge: 'مختصر وضاحت', title: 'کیا آپ کا یہی مطلب ہے؟', missing: 'تھوڑی مزید تفصیل درکار ہے', note: 'ماخذ کی جانچ کے لیے اس سوال کی تصدیق کریں، یا اپنا اصل سوال تبدیل کریں۔', yes: 'ہاں، اسے جانچیں', no: 'نہیں، میں ترمیم کروں گا', edit: 'میرا سوال تبدیل کریں' },
  id: { badge: 'Klarifikasi singkat', title: 'Apakah ini maksud Anda?', missing: 'Tambahkan sedikit detail', note: 'Konfirmasi pertanyaan ini untuk memeriksa sumbernya, atau edit pertanyaan asli Anda.', yes: 'Ya, periksa ini', no: 'Tidak, saya ingin mengedit', edit: 'Edit pertanyaan saya' },
  es: { badge: 'Una breve aclaración', title: '¿Es esto lo que quieres decir?', missing: 'Necesitamos un poco más de detalle', note: 'Confirma esta pregunta para comprobar sus fuentes o edita tu pregunta original.', yes: 'Sí, compruébalo', no: 'No, quiero editar', edit: 'Editar mi pregunta' },
  fr: { badge: 'Une petite précision', title: 'Est-ce bien ce que vous voulez dire ?', missing: 'Un peu plus de détails nous aiderait', note: 'Confirmez cette formulation pour vérifier ses sources, ou modifiez votre question initiale.', yes: 'Oui, vérifier', no: 'Non, je veux modifier', edit: 'Modifier ma question' },
  de: { badge: 'Kurze Rückfrage', title: 'Meinen Sie das?', missing: 'Ein paar weitere Details helfen', note: 'Bestätigen Sie diese Frage, um ihre Quellen zu prüfen, oder bearbeiten Sie Ihre ursprüngliche Frage.', yes: 'Ja, das prüfen', no: 'Nein, bearbeiten', edit: 'Meine Frage bearbeiten' },
};

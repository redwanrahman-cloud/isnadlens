import type {DisplayLanguage} from './display-copy';

export type ReviewRecord = {
  verdict:string; reason_codes:string[];
  entailment_review?:{status:string;raw_review?:unknown;raw_provider_review?:unknown};
  source_review_attempts?:{review:unknown;raw_provider_review?:unknown}[];
  qualified_explanation_review?:{status:string};
};
const rejectedReasons=new Set(['FINAL_EXPLANATION_UNCONFIRMED','SOURCE_ENTAILMENT_UNCONFIRMED','CLAIM_MEANING_OR_CONTRADICTION_UNCONFIRMED','QUALIFICATION_DETAIL_UNCONFIRMED']);
export function answerReviewRejected(record:ReviewRecord):boolean {
  return record.verdict==='not_evaluated'&&(record.entailment_review?.status==='rejected'||record.reason_codes.some(reason=>rejectedReasons.has(reason)));
}
/** Only display recorded reviewer diagnostics; never infer a missing objection. */
export function recordedReviewDiagnostic(record:ReviewRecord):{reason:string;language:string|null;detail:string}|null {
  const last=record.entailment_review??record.source_review_attempts?.at(-1);
  const original=last?.raw_provider_review;
  const originalDiagnostic=original&&typeof original==='object'&&'explanation_diagnostic' in original?original.explanation_diagnostic:null;
  // The normalized relationship check may replace a specific objection with a
  // generic mismatch. Preserve the specific original reviewer note when present.
  const raw=originalDiagnostic&&typeof originalDiagnostic==='object'&&'reason' in originalDiagnostic&&originalDiagnostic.reason!=='none'?original:record.entailment_review?.raw_review??record.source_review_attempts?.at(-1)?.review;
  if(!raw||typeof raw!=='object'||!('explanation_diagnostic' in raw))return null;
  const d=raw.explanation_diagnostic;
  if(!d||typeof d!=='object'||!('reason' in d)||!('detail' in d)||typeof d.reason!=='string'||typeof d.detail!=='string'||d.reason==='none')return null;
  return {reason:d.reason.slice(0,80),detail:d.detail.slice(0,500),language:'language' in d&&typeof d.language==='string'?d.language:null};
}
export const reviewStatusCopy:Record<DisplayLanguage,{badge:string;summary:string;details:string;note:string;missing:string;download:string}>={
 en:{badge:'Answer review not passed',summary:'Sources were found, but the proposed answer did not pass review.',details:'Why the answer was withheld',note:'Reviewer note · original language',missing:'No specific reviewer note was recorded. The sources alone do not confirm an answer.',download:'Download diagnostic record'},
 ar:{badge:'لم يجتز الجواب المراجعة',summary:'عُثر على مصادر، لكن الجواب المقترح لم يجتز المراجعة.',details:'لماذا لم يُعتمد الجواب',note:'ملاحظة المراجع · باللغة الأصلية',missing:'لم تُسجّل ملاحظة محددة من المراجع. وجود المصادر وحده لا يؤكد الجواب.',download:'تنزيل سجل التشخيص'},
 bn:{badge:'উত্তর পর্যালোচনায় উত্তীর্ণ হয়নি',summary:'উৎস পাওয়া গেছে, কিন্তু প্রস্তাবিত উত্তর পর্যালোচনায় উত্তীর্ণ হয়নি।',details:'কেন উত্তর দেওয়া হয়নি',note:'পর্যালোচকের মন্তব্য · মূল ভাষায়',missing:'পর্যালোচকের নির্দিষ্ট মন্তব্য নথিভুক্ত নেই। শুধু উৎস পাওয়া উত্তর নিশ্চিত করে না।',download:'বিশ্লেষণের রেকর্ড ডাউনলোড'},
 hi:{badge:'उत्तर समीक्षा में स्वीकार नहीं हुआ',summary:'स्रोत मिले, लेकिन प्रस्तावित उत्तर समीक्षा में स्वीकार नहीं हुआ।',details:'उत्तर क्यों रोका गया',note:'समीक्षक की टिप्पणी · मूल भाषा',missing:'समीक्षक की विशिष्ट टिप्पणी दर्ज नहीं है। केवल स्रोत मिलना उत्तर की पुष्टि नहीं करता।',download:'जाँच रिकॉर्ड डाउनलोड करें'},
 ur:{badge:'جواب جائزے میں منظور نہیں ہوا',summary:'ماخذ مل گئے، لیکن مجوزہ جواب جائزے میں منظور نہیں ہوا۔',details:'جواب کیوں روکا گیا',note:'جائزہ لینے والے کا نوٹ · اصل زبان',missing:'کوئی مخصوص نوٹ درج نہیں ہوا۔ صرف ماخذ ملنا جواب کی تصدیق نہیں کرتا۔',download:'تشخیصی ریکارڈ ڈاؤن لوڈ کریں'},
 id:{badge:'Jawaban belum lolos peninjauan',summary:'Sumber ditemukan, tetapi jawaban yang diusulkan belum lolos peninjauan.',details:'Mengapa jawaban ditahan',note:'Catatan peninjau · bahasa asli',missing:'Tidak ada catatan khusus dari peninjau. Sumber saja tidak memastikan jawaban.',download:'Unduh catatan diagnostik'},
 es:{badge:'La respuesta no superó la revisión',summary:'Se encontraron fuentes, pero la respuesta propuesta no superó la revisión.',details:'Por qué se retuvo la respuesta',note:'Nota del revisor · idioma original',missing:'No se registró una nota específica del revisor. Las fuentes por sí solas no confirman una respuesta.',download:'Descargar registro de diagnóstico'},
 fr:{badge:'Réponse non validée par la revue',summary:'Des sources ont été trouvées, mais la réponse proposée n’a pas été validée.',details:'Pourquoi la réponse a été retenue',note:'Note du réviseur · langue originale',missing:'Aucune note précise du réviseur n’a été enregistrée. Les sources seules ne confirment pas une réponse.',download:'Télécharger le diagnostic'},
 de:{badge:'Antwortprüfung nicht bestanden',summary:'Quellen wurden gefunden, aber die vorgeschlagene Antwort hat die Prüfung nicht bestanden.',details:'Warum die Antwort zurückgehalten wurde',note:'Prüfhinweis · Originalsprache',missing:'Es wurde kein konkreter Prüfhinweis gespeichert. Quellen allein bestätigen keine Antwort.',download:'Diagnoseprotokoll herunterladen'},
};

export const qualifiedAnswerLabel:Record<DisplayLanguage,string>={en:'Qualified answer · limits apply',ar:'جواب مقيّد · تُراعى حدوده',bn:'শর্তযুক্ত উত্তর · সীমা প্রযোজ্য',hi:'शर्तों सहित उत्तर · सीमाएँ लागू',ur:'مشروط جواب · حدود لاگو ہیں',id:'Jawaban bersyarat · batasan berlaku',es:'Respuesta con condiciones · se aplican límites',fr:'Réponse nuancée · limites applicables',de:'Eingeschränkte Antwort · Grenzen beachten'};

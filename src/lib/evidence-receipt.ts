import type {VerificationRecord,EvidenceItem} from './contracts';
export type ReceiptRecord=Pick<VerificationRecord,'record_id'|'created_at'|'original_claim'|'summary_en'|'summary_ar'|'audit_hash'|'limitations'>&{input_language?:string;corpus_selection?:string;verdict:string;evidence_items:(Pick<EvidenceItem,'source_id'|'title'|'version'|'locator'|'attribution'|'source_url'|'quotation_sha256'|'quotation'>&Partial<Pick<EvidenceItem,'publisher_fields'|'source_context'>>)[]};
export function evidenceReceipt(record:ReceiptRecord):string{
  const lines=[
    'IsnadLens — evidence receipt',
    'An abridged record of the displayed verification and its source evidence.',
    `Record: ${record.record_id}`,`Created: ${record.created_at}`,`Input language: ${record.input_language??'not recorded'}`,`Selected sources: ${record.corpus_selection??'not recorded'}`,
    '', 'Original question:',record.original_claim,'',`Result: ${record.verdict}`,
    '', 'English explanation:',record.summary_en,'', 'Arabic explanation:',record.summary_ar,
    '', 'Original verification record seal:',record.audit_hash,
    'This seal identifies the full original verification record; it is not a checksum of this abridged receipt.',
  ];
  for(const [index,item] of record.evidence_items.entries()){
    lines.push('',`Source ${index+1}: ${item.title}`,`Edition: ${item.version}`,`Locator: ${item.locator}`,`Attribution: ${item.attribution}`,`Source URL: ${item.source_url}`,`Quotation SHA-256: ${item.quotation_sha256}`,'','Original source quotation:',item.quotation);
    if(item.publisher_fields?.grade)lines.push('',`Publisher-supplied hadith grade: ${item.publisher_fields.grade}`,'Not an independent hadith grading by IsnadLens.');
    if(item.publisher_fields?.takhrij)lines.push(`Publisher references: ${item.publisher_fields.takhrij}`);
    for(const context of item.source_context??[])lines.push('',`Source context (${context.position}, ${context.locator}):`,context.quotation,`Context SHA-256: ${context.quotation_sha256}`);
    lines.push('',`Source licence/notice: ${item.source_id.startsWith('QURAN-')?'https://tanzil.net/docs/Text_License':'https://hadeethenc.com/en/home'}`);
  }
  lines.push('','Limits of this result:',...record.limitations.map(limit=>`- ${limit}`),'','This receipt is not a personal fatwa or independent scholarly certification.','Source and copyright notices: /sources');
  return lines.join('\n');
}
export const receiptLabels={ar:'تنزيل سجل الأدلة',en:'Download evidence receipt',bn:'প্রমাণের রেকর্ড ডাউনলোড করুন',hi:'साक्ष्य रिकॉर्ड डाउनलोड करें',ur:'دلائل کا ریکارڈ ڈاؤن لوڈ کریں',id:'Unduh catatan bukti',es:'Descargar registro de pruebas',fr:'Télécharger le relevé des preuves',de:'Belegnachweis herunterladen'} as const;

import {expect,it} from 'vitest';
import {evidenceReceipt,type ReceiptRecord} from '../src/lib/evidence-receipt';
const record:ReceiptRecord={record_id:'test',created_at:'2026-10-05T11:00:00Z',input_language:'ar',corpus_selection:'both',original_claim:'هل هذا صحيح؟',verdict:'supported_within_selected_corpus',summary_en:'A source-based explanation.',summary_ar:'شرح مبني على المصدر.',audit_hash:'record-seal',limitations:['Limited to the selected sources.'],evidence_items:[{source_id:'QURAN-AR-TANZIL',title:'Quran',version:'1.1',locator:'sample',attribution:'Source: Tanzil Project',source_url:'https://tanzil.net',quotation:'نص\nباللغة العربية',quotation_sha256:'quote-seal',source_context:[]},{source_id:'HADITH',title:'Hadith',version:'edition',locator:'sample',attribution:'HadeethEnc',source_url:'https://hadeethenc.com',quotation:'An unchanged quotation.',quotation_sha256:'hadith-seal',publisher_fields:{grade:'Publisher grade',takhrij:'Publisher reference'}}]};
it('retains original input and exact source text, attribution and source licence notices',()=>{
  const receipt=evidenceReceipt(record);expect(receipt).toContain(record.original_claim);for(const item of record.evidence_items){expect(receipt).toContain(item.quotation);expect(receipt).toContain(item.attribution);expect(receipt).toContain(item.source_url);}
  expect(receipt).toContain('https://tanzil.net/docs/Text_License');expect(receipt).toContain('https://hadeethenc.com/en/home');expect(receipt).toContain('Publisher-supplied hadith grade: Publisher grade');
});
it('distinguishes the full-record seal from the abridged receipt and retains an unresolved result',()=>{
  const receipt=evidenceReceipt({...record,verdict:'not_evaluated',evidence_items:[]});expect(receipt).toContain('Result: not_evaluated');expect(receipt).toContain('not a checksum of this abridged receipt');expect(receipt).toContain(record.limitations[0]);expect(receipt).not.toContain('Source 1:');
});

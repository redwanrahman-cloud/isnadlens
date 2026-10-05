import {receiptHtml} from '../src/lib/receipt-pdf';
import {it,expect} from 'vitest';
import {checkedExampleReceipt} from '../src/lib/checked-example-receipt';
import example from '../src/lib/checked-example.json';
import {landingExample,landingExampleCopy} from '../src/lib/landing-example';

it('exports the historical example without presenting it as a new or complete assessment',()=>{
 const receipt=checkedExampleReceipt();
 expect(receipt).toContain('not a result for your current question');
 expect(receipt).toContain('does not contain all evidence');
 expect(receipt).not.toContain('Original verification record seal:');
 expect(receipt).toContain(example.record_id);
 expect(receipt).toContain(landingExample.question_en);
 expect(receipt).toContain(landingExample.summary_en);
 expect(receipt).toContain(example.evidence.quotation);
 expect(receipt).toContain(example.translation.quotation);
 expect(receipt).toContain(example.translation.publisher_notice);
 expect(receipt).toContain(example.translation.publisher_fields.footnotes);
 for(const context of example.evidence.source_context){expect(receipt).toContain(context.quotation);expect(receipt).toContain(context.quotation_sha256);}
});

it('keeps the negative planning question and direct negative answer together in exports',()=>{
 const receipt=checkedExampleReceipt();
 expect(landingExample.question_en).toContain('stop planning');
 expect(landingExample.summary_en).toMatch(/^No\./);
 expect(landingExample.summary_ar).toMatch(/^لا\./);
 expect(receipt).toContain(landingExample.question_en);
 expect(receipt).toContain(landingExample.summary_en);
 expect(receipt).not.toContain(example.summary_en);
});

it('keeps the illustrative receipt disclosure in the rendered PDF HTML',()=>{
 expect(receiptHtml(checkedExampleReceipt())).toContain('Source-based illustrative example');
});


it('uses the selected language for the sample question and exported explanation',()=>{
 for(const language of ['ar','en','bn','hi','ur','id','es','fr','de'] as const){
  const copy=landingExampleCopy(language);const receipt=checkedExampleReceipt(language);
  expect(receipt).toContain(copy.question);expect(receipt).toContain(copy.summary);
  if(language!=='es')expect(receipt).not.toContain(example.original_claim);
 }
});

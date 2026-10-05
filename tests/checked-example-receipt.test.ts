import {it,expect} from 'vitest';
import {checkedExampleReceipt} from '../src/lib/checked-example-receipt';
import example from '../src/lib/checked-example.json';

it('exports the historical example without presenting it as a new or complete assessment',()=>{
 const receipt=checkedExampleReceipt();
 expect(receipt).toContain('not a result for your current question');
 expect(receipt).toContain('does not contain all evidence');
 expect(receipt).not.toContain('Original verification record seal:');
 expect(receipt).toContain(example.record_id);
 expect(receipt).toContain(example.original_claim);
 expect(receipt).toContain(example.summary_en);
 expect(receipt).toContain(example.evidence.quotation);
 expect(receipt).toContain(example.translation.quotation);
 expect(receipt).toContain(example.translation.publisher_notice);
 expect(receipt).toContain(example.translation.publisher_fields.footnotes);
 for(const context of example.evidence.source_context){expect(receipt).toContain(context.quotation);expect(receipt).toContain(context.quotation_sha256);}
});

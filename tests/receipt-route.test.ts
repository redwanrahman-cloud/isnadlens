import {expect,it,vi} from 'vitest';
vi.mock('../src/lib/receipt-pdf',()=>({renderReceiptPdf:vi.fn()}));
import {POST} from '../src/app/api/receipt/route';
it.each([null,[],17,'text',{}, {receipt:'untrusted',record_id:'test'}])('rejects malformed receipt input without attempting PDF rendering: %j',async body=>{
 const response=await POST(new Request('http://localhost/api/receipt',{method:'POST',body:JSON.stringify(body)}));
 expect(response.status).toBe(400);
 expect(await response.json()).toEqual({error:'Invalid receipt'});
});

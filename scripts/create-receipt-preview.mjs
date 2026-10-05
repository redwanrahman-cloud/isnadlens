import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {evidenceReceipt} from '../src/lib/evidence-receipt.ts';
const record=JSON.parse(readFileSync('tests/fixtures/dashboard-records.json','utf8')).quran;
const r=await fetch('http://127.0.0.1:3100/api/receipt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({receipt:evidenceReceipt(record),record_id:record.record_id})});
if(!r.ok)throw Error(await r.text());const pdf=Buffer.from(await r.arrayBuffer());if(pdf.subarray(0,5).toString()!=='%PDF-')throw Error('INVALID_PDF');mkdirSync('output/pdf',{recursive:true});writeFileSync('output/pdf/isnadlens-receipt-preview.pdf',pdf);console.log(JSON.stringify({record:record.record_id,pdfBytes:pdf.length,paidCalls:0}));

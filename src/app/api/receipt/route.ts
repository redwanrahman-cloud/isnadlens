import {renderReceiptPdf} from '@/lib/receipt-pdf';
export const runtime='nodejs';
export async function POST(request:Request){
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Invalid receipt'},{status:400});let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>400_000){await reader.cancel();return Response.json({error:'Receipt too large'},{status:413});}chunks.push(value);}
 let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return Response.json({error:'Invalid receipt'},{status:400});}
 if(typeof data.receipt!=='string'||data.receipt.length>100_000||!data.receipt.startsWith('IsnadLens — evidence receipt\n')||typeof data.record_id!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(data.record_id))return Response.json({error:'Invalid receipt'},{status:400});
 try{const pdf=await renderReceiptPdf(data.receipt);return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="isnadlens-${data.record_id}.pdf"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
 catch(error){return Response.json({error:error instanceof Error&&error.message==='PDF_BUSY'?'PDF_BUSY':'PDF_UNAVAILABLE'},{status:error instanceof Error&&error.message==='PDF_BUSY'?429:503});}
}

export async function downloadReceiptPdf(receipt:string,recordId:string){
 const response=await fetch('/api/receipt',{signal:AbortSignal.timeout(30000),method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({receipt,record_id:recordId})});
 if(!response.ok||!response.headers.get('Content-Type')?.includes('application/pdf'))throw new Error('PDF_UNAVAILABLE');
 const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=`isnadlens-${recordId.replace(/[^a-zA-Z0-9_-]/g,'')}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}

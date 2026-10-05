// Browser text shaping preserves Arabic joining, diacritics and selectable text.
import {chromium} from 'playwright-core';
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const receiptLogo='<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="#b6924c" stroke-width="1.4"><path d="M10 10h28v28H10z M24 4l20 20-20 20L4 24z M24 10l14 14-14 14-14-14z"/><circle cx="24" cy="24" r="8"/></svg>';
export function receiptHtml(receipt:string){
 const groups=receipt.split(/\n\s*\n/);const body=groups.map((group,index)=>{
  const lines=group.split('\n');if(index===0)return `<section class="metadata">${lines.slice(1).map(line=>`<p dir="auto">${escape(line)}</p>`).join('')}</section>`;
  const heading=/^(Original question:|English explanation:|Arabic explanation:|Original verification record seal:|Source \d+:|Original source quotation:|Source context |Limits of this result:)/.test(lines[0]);
  const cls=lines[0]==='Original source quotation:'||lines[0].startsWith('Source context ')?'source':lines[0].includes('explanation:')?'explanation':'';
  return `<section class="${cls}">${lines.map((line,n)=>heading&&n===0?`<h2 dir="auto">${escape(line.replace(/:$/,''))}</h2>`:`<p dir="auto" class="${/^[a-f0-9]{64}$|SHA-256:/.test(line)?'hash':''}">${escape(line)}</p>`).join('')}</section>`;
 }).join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>IsnadLens · Evidence receipt</title><style>
 *{box-sizing:border-box}body{margin:0;color:#173d39;font:11px/1.7 Arial,'Noto Sans Arabic',Tahoma,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}header{background:#123e36;color:#fff;padding:23px 25px;border-bottom:3px solid #b6924c;display:flex;align-items:center;gap:14px}header h1{font:30px Georgia,serif;margin:0}header p{margin:0;color:#ece2c8;font-size:10px;letter-spacing:1.3px}.intro{margin:22px 0 16px} .intro h1{font:24px Georgia,serif;margin:0 0 8px}.intro p{color:#526963;margin:0}section{margin:15px 0;padding:0 3px}h2{font-size:12px;color:#315b4c;border-bottom:1px solid #dce3d8;padding-bottom:5px;margin:0 0 9px;break-after:avoid}p{margin:4px 0;white-space:pre-wrap;overflow-wrap:anywhere;orphans:3;widows:3}p:dir(rtl){font-size:15px;line-height:2.1}.metadata{background:#f3f3eb;border:1px solid #dce3d8;border-radius:6px;padding:13px 16px;font-size:10px}.source{background:#faf7ee;border-inline-start:3px solid #b6924c;padding:13px 16px}.source p:dir(rtl){font-size:19px;line-height:2.2}.explanation{border-inline-start:3px solid #8fae95;padding-inline-start:14px}.hash{font:9px/1.8 monospace;color:#526963}section:not(.source){break-inside:auto}
 </style></head><body><header>${receiptLogo}<div><h1>IsnadLens</h1><p>EVIDENCE BRINGS CLARITY</p></div></header><div class="intro"><h1>Evidence receipt</h1><p>An abridged record of the displayed answer and its source evidence.</p></div>${body}</body></html>`;
}
let active=0;
export async function renderReceiptPdf(receipt:string):Promise<Buffer>{
 if(active>=2)throw new Error('PDF_BUSY');active++;
 let browser;
 try{browser=await chromium.launch({headless:true,...(process.env.ISNADLENS_CHROMIUM_PATH?{executablePath:process.env.ISNADLENS_CHROMIUM_PATH}:{channel:'chrome'})});const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.route('**/*',route=>route.abort());await page.setContent(receiptHtml(receipt),{waitUntil:'load',timeout:15000});await page.evaluate(()=>document.fonts.ready);return await page.pdf({format:'A4',printBackground:true,displayHeaderFooter:true,margin:{top:'16mm',bottom:'19mm',left:'17mm',right:'17mm'},headerTemplate:'<div></div>',footerTemplate:'<div style="width:100%;font:9px Arial;color:#526963;padding:0 17mm;display:flex;justify-content:space-between;border-top:1px solid #dce3d8;padding-top:7px"><span>IsnadLens · Source text and AI explanation are separate · Not a personal fatwa</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});}
 finally{try{await browser?.close();}finally{active--;}}
}

'use client';
import {downloadReceiptPdf} from '@/lib/download-receipt';
import {useEffect,useState} from 'react';
import {encodeChecks,insertCheck,restoreChecks,type SavedCheck} from '@/lib/recent-checks';
import {recentCopy} from '@/lib/recent-copy';
import type {ClaimLanguage} from '@/lib/claim-language';
export function RecentChecks({language,service,current,disabled,onLoad}:{language:ClaimLanguage;service:'main'|'pilgrimage';current:SavedCheck|null;disabled:boolean;onLoad:(check:SavedCheck)=>void}){
 const t=recentCopy(language);const key=`isnadlens-recent-${service}-v1`;const [checks,setChecks]=useState<SavedCheck[]>([]);const [error,setError]=useState(false);
 useEffect(()=>{function read(){try{setChecks(restoreChecks(localStorage.getItem(key)));setError(false);}catch{setChecks([]);setError(true);}}read();function changed(e:StorageEvent){if(e.key===key||e.key===null)read();}window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[key]);
 function save(){if(!current)return;try{const next=insertCheck(restoreChecks(localStorage.getItem(key)),current);localStorage.setItem(key,encodeChecks(next));setChecks(next);setError(false);}catch{setError(true);}}
 function remove(id:string){try{const next=restoreChecks(localStorage.getItem(key)).filter(check=>check.record_id!==id);localStorage.setItem(key,encodeChecks(next));setChecks(next);setError(false);}catch{setError(true);}}
 function clear(){try{localStorage.removeItem(key);setChecks([]);setError(false);}catch{setError(true);}}
 const [downloading,setDownloading]=useState('');const [pdfError,setPdfError]=useState(false);
 async function download(check:SavedCheck){if(downloading)return;setDownloading(check.record_id);setPdfError(false);try{await downloadReceiptPdf(check.receipt,check.record_id);}catch{setPdfError(true);}finally{setDownloading('');}}

 return <section aria-label={t[0]} style={{marginBlock:'1rem'}}>{current&&<button type="button" disabled={disabled||checks.some(check=>check.record_id===current.record_id)} onClick={save}>{checks.some(check=>check.record_id===current.record_id)?t[2]:t[1]}</button>}<details><summary>{t[0]} ({checks.length})</summary><p className="context-note">{t[9]}</p>{!checks.length&&<p>{t[3]}</p>}{checks.map(check=><article key={check.record_id} style={{marginBlock:'1rem'}}><p dir="auto">{check.claim}</p><time dateTime={check.created_at}>{new Date(check.created_at).toLocaleString(language)}</time><div><button type="button" disabled={disabled} onClick={()=>onLoad(check)}>{t[4]}</button><button type="button" disabled={Boolean(downloading)} onClick={()=>void download(check)}>{t[6]}</button><button type="button" onClick={()=>remove(check.record_id)}>{t[7]}</button></div><details><summary>{t[5]}</summary><pre dir="auto" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit'}}>{check.receipt}</pre></details></article>)}{(checks.length>0||error)&&<button type="button" onClick={clear}>{t[8]}</button>}</details>{pdfError&&<p role="alert">{language==='ar'?'تعذر تنزيل PDF. حاول مرة أخرى.':'The PDF could not download. Please try again.'}</p>}{error&&<p role="status">{t[10]}</p>}</section>;
}

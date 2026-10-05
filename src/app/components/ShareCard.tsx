'use client';
import {wrapShareText} from '@/lib/share-text';
import {useEffect,useRef,useState} from 'react';
import type {DisplayLanguage} from '@/lib/display-copy';
import {workspaceCopy} from '@/lib/workspace-copy';
import {WorkspaceIcon} from './WorkspaceIcon';
type ShareRecord={record_id:string;original_claim:string;created_at:string;evidence_items:{locator:string;source_url:string}[]};
export function ShareCard({record,summary,verdict,language}:{record:ShareRecord;summary:string;verdict:string;language:DisplayLanguage}){
 const trigger=useRef<HTMLButtonElement>(null);const t=workspaceCopy(language);const dialog=useRef<HTMLDialogElement>(null);const canvas=useRef<HTMLCanvasElement>(null);const [open,setOpen]=useState(false);const [copied,setCopied]=useState('');const [preview,setPreview]=useState('');
 const excerpt=summary.length>650?summary.slice(0,650)+'…':summary;
 const references=record.evidence_items.slice(0,5).map(e=>`${e.locator} · ${e.source_url}`).join('\n');
 const text=`IsnadLens · ${t.excerpt}\n${verdict}\n\n${record.original_claim}\n\n${excerpt}\n\n${references}\n\n${t.excerptNote}\n${record.record_id} · ${record.created_at}`;
 useEffect(()=>{if(!open)return;const modal=dialog.current;modal?.showModal();return()=>{modal?.close();queueMicrotask(()=>trigger.current?.focus());};},[open]);
 useEffect(()=>{
  if(!open||!canvas.current)return;const c=canvas.current,ctx=c.getContext('2d');if(!ctx)return;
  const rtl=language==='ar'||language==='ur';const pad=64,width=1080;ctx.font='28px Tahoma, Arial, sans-serif';
  const lines=(value:string,max:number)=>wrapShareText(value,max,text=>ctx.measureText(text).width);
  const sections=[{text:verdict,size:27,color:'#174c45'},{text:record.original_claim,size:32,color:'#123f38'},{text:excerpt,size:28,color:'#173d39'},{text:references,size:24,color:'#685535'},{text:t.excerptNote,size:23,color:'#505f57'},{text:record.record_id+' · '+record.created_at,size:19,color:'#505f57'}];
  const wrapped=sections.map(s=>{ctx.font=`${s.size}px Tahoma, Arial, sans-serif`;return {...s,lines:lines(s.text,width-pad*2)};});
  c.width=width;c.height=170+wrapped.reduce((sum,s)=>sum+s.lines.length*s.size*1.65+28,0)+50;
  ctx.fillStyle='#f7f4eb';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#123f38';ctx.fillRect(0,0,width,116);ctx.fillStyle='#ffffff';ctx.font='bold 40px Georgia, serif';ctx.textAlign='left';ctx.fillText('IsnadLens',pad,73);ctx.strokeStyle='#b79858';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(pad,137);ctx.lineTo(width-pad,137);ctx.stroke();
  let y=185;ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=rtl?'right':'left';for(const s of wrapped){ctx.font=`${s.size}px Tahoma, Arial, sans-serif`;ctx.fillStyle=s.color;for(const line of s.lines){ctx.fillText(line,rtl?width-pad:pad,y);y+=s.size*1.65;}y+=28;}setPreview(c.toDataURL('image/png'));
 },[open,summary,verdict,language,record,t.excerptNote]);
 function download(){if(!preview)return;const a=document.createElement('a');a.href=preview;a.download=`isnadlens-${record.record_id.replace(/[^a-z0-9-]/gi,'').slice(0,60)}.png`;a.click();}
 async function copy(){try{await navigator.clipboard.writeText(text);setCopied(t.copied);}catch{setCopied(t.copyFailed);}}
 return <><button ref={trigger} className="share-button" type="button" onClick={()=>{setCopied('');setOpen(true);}}><WorkspaceIcon name="share"/>{t.share}</button>{open&&<dialog ref={dialog} className="share-dialog" aria-labelledby="share-title" onCancel={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}}><div className="dialog-heading"><h2 id="share-title">{t.excerpt}</h2><button type="button" onClick={()=>setOpen(false)}>{t.close}</button></div><p>{t.excerptNote}</p><canvas ref={canvas} hidden/>{preview&&<img src={preview} alt={text}/>}<div className="report-actions"><button type="button" disabled={!preview} onClick={download}>{t.png}</button><button type="button" onClick={()=>void copy()}>{t.copy}</button></div>{copied&&<p role="status">{copied}</p>}<details><summary>{t.text}</summary><textarea readOnly value={text} rows={8}/></details></dialog>}</>;
}

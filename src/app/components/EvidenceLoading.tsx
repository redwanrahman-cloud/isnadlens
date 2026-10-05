'use client';

import {useEffect,useRef,useState} from 'react';
import type {DisplayLanguage} from '@/lib/display-copy';
import {workspaceCopy} from '@/lib/workspace-copy';
import {WorkspaceIcon} from './WorkspaceIcon';

const copy:Record<DisplayLanguage,{badge:string;title:string;detail:string;path:string;waiting:string;slow:string}>={
 en:{badge:'Working on your question',title:'Following the evidence',detail:'Looking for relevant passages and reviewing what they support.',path:'How your report is prepared',waiting:'Your report will appear here when it is ready.',slow:'Still working. Your question is safe here; there’s no need to send it again.'},
 ar:{badge:'نعمل على سؤالك',title:'نتتبّع الأدلة',detail:'نبحث عن النصوص ذات الصلة ونراجع ما تدعمه.',path:'كيف يُعَدّ تقريرك',waiting:'سيظهر تقريرك هنا عندما يصبح جاهزًا.',slow:'ما زلنا نعمل. سؤالك محفوظ هنا؛ لا حاجة إلى إرساله مرة أخرى.'},
 bn:{badge:'আপনার প্রশ্ন নিয়ে কাজ চলছে',title:'প্রমাণের অনুসন্ধানে',detail:'প্রাসঙ্গিক বক্তব্য খোঁজা এবং সেগুলো কী সমর্থন করে তা পর্যালোচনা করা হচ্ছে।',path:'যেভাবে আপনার প্রতিবেদন তৈরি হয়',waiting:'প্রস্তুত হলে আপনার প্রতিবেদন এখানেই দেখা যাবে।',slow:'এখনও কাজ চলছে। আপনার প্রশ্ন এখানে সংরক্ষিত আছে; আবার পাঠানোর প্রয়োজন নেই।'},
 hi:{badge:'आपके प्रश्न पर काम जारी है',title:'प्रमाण की खोज में',detail:'संबंधित अंश खोजे जा रहे हैं और उनके अर्थ की समीक्षा की जा रही है।',path:'आपकी रिपोर्ट कैसे तैयार होती है',waiting:'तैयार होने पर आपकी रिपोर्ट यहीं दिखाई देगी।',slow:'अभी काम जारी है। आपका प्रश्न यहाँ सुरक्षित है; इसे दोबारा भेजने की ज़रूरत नहीं है।'},
 ur:{badge:'آپ کے سوال پر کام جاری ہے',title:'شواہد کی تلاش میں',detail:'متعلقہ عبارتیں تلاش کر کے ان کے مفہوم کا جائزہ لیا جا رہا ہے۔',path:'آپ کی رپورٹ کیسے تیار ہوتی ہے',waiting:'تیار ہونے پر آپ کی رپورٹ یہیں نظر آئے گی۔',slow:'ابھی کام جاری ہے۔ آپ کا سوال یہاں محفوظ ہے؛ اسے دوبارہ بھیجنے کی ضرورت نہیں۔'},
 id:{badge:'Pertanyaan Anda sedang diproses',title:'Menelusuri bukti',detail:'Mencari kutipan yang relevan dan meninjau makna yang didukungnya.',path:'Cara laporan Anda disiapkan',waiting:'Laporan Anda akan muncul di sini saat siap.',slow:'Masih diproses. Pertanyaan Anda tersimpan di sini; tidak perlu mengirimkannya lagi.'},
 es:{badge:'Estamos trabajando en tu pregunta',title:'Siguiendo la evidencia',detail:'Buscamos pasajes pertinentes y revisamos qué respaldan.',path:'Cómo preparamos tu informe',waiting:'Tu informe aparecerá aquí cuando esté listo.',slow:'Seguimos trabajando. Tu pregunta está guardada aquí; no hace falta enviarla otra vez.'},
 fr:{badge:'Nous traitons votre question',title:'Sur la piste des preuves',detail:'Nous recherchons les passages pertinents et examinons ce qu’ils étayent.',path:'Comment votre rapport est préparé',waiting:'Votre rapport apparaîtra ici dès qu’il sera prêt.',slow:'Le traitement continue. Votre question est conservée ici ; inutile de la renvoyer.'},
 de:{badge:'Ihre Frage wird bearbeitet',title:'Den Belegen auf der Spur',detail:'Wir suchen passende Textstellen und prüfen, was sie belegen.',path:'So entsteht Ihr Bericht',waiting:'Ihr Bericht erscheint hier, sobald er fertig ist.',slow:'Die Bearbeitung läuft noch. Ihre Frage bleibt hier erhalten; bitte nicht erneut senden.'}
};

/** Indeterminate activity, not invented server progress. No timed stage completions. */
export function EvidenceLoading({language}:{language:DisplayLanguage}){
 const panel=useRef<HTMLDivElement>(null);
 const [takingLonger,setTakingLonger]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setTakingLonger(true),25000);return()=>clearTimeout(timer);},[]);
 useEffect(()=>{
  if(!window.matchMedia('(max-width:850px)').matches)return;
  const frame=requestAnimationFrame(()=>{
   const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.motion==='paused';
   panel.current?.scrollIntoView({block:'start',behavior:reduce?'instant':'smooth'});
  });
  return()=>cancelAnimationFrame(frame);
 },[]);
 const t=copy[language],ui=workspaceCopy(language);
 return <div ref={panel} className="evidence-loading" lang={language} dir={language==='ar'||language==='ur'?'rtl':'ltr'}>
  <span className="evidence-loading-badge"><span/>{t.badge}</span>
  <div className="evidence-loading-art" aria-hidden="true">
   <div className="evidence-loading-halo"/>
   <div className="evidence-source-sheet sheet-left"><WorkspaceIcon name="text"/><i/><i/><i/></div>
   <div className="evidence-source-sheet sheet-right"><WorkspaceIcon name="text"/><i/><i/><i/></div>
   <div className="evidence-loading-orbit"><span/></div>
   <div className="evidence-loading-book"><WorkspaceIcon name="book"/><span/></div>
   <span className="evidence-loading-spark"><WorkspaceIcon name="spark"/></span>
  </div>
  <h2>{t.title}</h2><p className="evidence-loading-detail">{t.detail}</p>
  <div className="evidence-loading-route">
   <p>{t.path}</p>
   <ol>{([['book',ui.sources],['spark',ui.context],['text',ui.conclusion]] as const).map(([icon,label])=><li key={icon}><span><WorkspaceIcon name={icon}/></span><strong>{label}</strong></li>)}</ol>
  </div>
  <p className="evidence-loading-status" role="status" aria-live="polite" aria-atomic="true">{takingLonger?t.slow:t.waiting}</p>
 </div>;
}

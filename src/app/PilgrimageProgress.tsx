'use client';
import {useEffect,useState} from 'react';
import {createProgress,progressSummary,recordProgress,undoProgress,resetProgress,restoreProgress,PROGRESS_REFERENCE,type PilgrimageActivity} from '@/lib/pilgrimage-progress';
import type {DisplayLanguage} from '@/lib/display-copy';
const STORAGE_KEY='isnadlens-pilgrimage-progress-v1';
export function PilgrimageProgress({language}:{language:DisplayLanguage}) {
  const ar=language==='ar';
  const [state,setState]=useState(createProgress);
  const [ready,setReady]=useState(false);
  const [saved,setSaved]=useState(true);
  useEffect(()=>{try{const stored=localStorage.getItem(STORAGE_KEY);if(stored){const resumed=restoreProgress(stored);if(resumed)setState(resumed);else setSaved(false);}}catch{setSaved(false);}setReady(true);},[]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setSaved(true);}catch{setSaved(false);}},[state,ready]);
  return <section className="coverage-box" aria-label={ar?'عداد الأشواط':'Round counter'}>
    <h2>{ar?'أين وصلت؟':'Where have you reached?'}</h2>
    <p>{ar?'سجّل كل شوط مكتمل بنفسك. الحفظ على هذا الجهاز فقط؛ لا يثبت العداد صحة النسك.':'Record each completed circuit or Sai leg yourself. Progress stays on this device; the counter does not certify ritual validity.'}</p>
    <div className="desk-grid">{(['tawaf','sai'] as PilgrimageActivity[]).map(activity=>{
      const summary=progressSummary(state,activity);
      return <div key={activity} id={`progress-${activity}`}>
        <h3>{activity==='tawaf'?(ar?'الطواف':'Tawaf'):(ar?'السعي':'Sai')}</h3>
        <p aria-live="polite">{ar?'المسجّل':'Recorded'}: <bdi>{summary.completed} / 7</bdi> · {ar?'المتبقي حسب السجل':'Remaining from your record'}: <bdi>{summary.remaining}</bdi></p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="primary-button" disabled={!ready||summary.uncertain||summary.completed===7} onClick={()=>setState(previous=>{const current=progressSummary(previous,activity);return current.uncertain||current.completed===7?previous:recordProgress(previous,activity,'completed');})}>{ar?'أكملت شوطاً':'Completed one'}</button>
          <button disabled={!ready||!state.events.some(event=>event.activity===activity)} onClick={()=>setState(previous=>undoProgress(previous,activity))}>{ar?'تراجع':'Undo'}</button>
          <button disabled={!ready||summary.uncertain} onClick={()=>setState(previous=>progressSummary(previous,activity).uncertain?previous:recordProgress(previous,activity,'uncertain'))}>{ar?'لست متأكداً من العدد':'Unsure of my count'}</button>
          <button disabled={!ready} onClick={()=>{if(window.confirm(ar?'مسح سجل هذا العداد؟':'Clear this counter’s record?'))setState(previous=>resetProgress(previous,activity));}}>{ar?'مسح':'Reset'}</button>
        </div>
        {summary.uncertain&&<p role="status">{ar?'لا يستطيع العداد حسم الشك. تعديل السجل لا يحسم الحكم الشرعي؛ اسأل مرشداً مؤهلاً عن حالتك.':'The counter cannot settle a doubtful count. Editing the record does not resolve the religious ruling; ask a qualified guide about your situation.'}</p>}
        {summary.countRecorded&&<p>{ar?'تم تسجيل سبعة. هذا لا يؤكد صحة النسك أو اكتمال بقية أعماله.':'Seven recorded. This does not certify ritual validity or completion of its other requirements.'}</p>}
      </div>;
    })}</div>
    {!saved&&<p role="status">{ar?'تعذر استرجاع السجل أو حفظه. راقب العدد بنفسك.':'Saved progress could not be restored or stored. Keep track of the count yourself.'}</p>}
    <p><a href={PROGRESS_REFERENCE.url} target="_blank" rel="noopener noreferrer">{ar?'مرجع العدد: موسوعة الأحاديث، 3309':'Count reference: HadeethEnc, 3309'} ↗</a></p>
    <p>{ar?'هذه الرواية تصف حجة الوداع؛ لا تُنقل أحكام إحرام الحج منها تلقائياً إلى العمرة المفردة.':'This report describes the Farewell Hajj. Its Hajj-specific Ihram instructions are not automatically a standalone Umrah guide.'}</p>
  </section>;
}

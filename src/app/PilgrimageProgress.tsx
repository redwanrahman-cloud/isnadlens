'use client';
import {WorkspaceIcon} from './components/WorkspaceIcon';
import {useEffect,useRef,useState} from 'react';
import {workspaceCopy} from '@/lib/workspace-copy';
import {createProgress,progressSummary,recordProgress,undoProgress,resetProgress,restoreProgress,PROGRESS_REFERENCE,type PilgrimageActivity} from '@/lib/pilgrimage-progress';
import {progressCopy} from '@/lib/progress-copy';
import type {DisplayLanguage} from '@/lib/display-copy';
const STORAGE_KEY='isnadlens-pilgrimage-progress-v1';
export function PilgrimageProgress({language}:{language:DisplayLanguage}) {
  const t=progressCopy(language);
  const [state,setState]=useState(createProgress);
  const [ready,setReady]=useState(false);
  const [saved,setSaved]=useState(true);
  const [resetting,setResetting]=useState<PilgrimageActivity|null>(null);
  const resetDialog=useRef<HTMLDialogElement>(null);
  const resetTrigger=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{if(!resetting)return;const modal=resetDialog.current;modal?.showModal();return()=>{modal?.close();queueMicrotask(()=>resetTrigger.current?.focus());};},[resetting]);
  useEffect(()=>{try{const stored=localStorage.getItem(STORAGE_KEY);if(stored){const resumed=restoreProgress(stored);if(resumed)setState(resumed);else setSaved(false);}}catch{setSaved(false);}setReady(true);},[]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setSaved(true);}catch{setSaved(false);}},[state,ready]);
  return <section id="journey-counting" className="coverage-box journey-progress" aria-label={t.counter}>
    <h2><WorkspaceIcon name="compass"/>{t.heading}</h2>
    <p>{t.intro}</p>
    <div className="desk-grid">{(['tawaf','sai'] as PilgrimageActivity[]).map(activity=>{
      const summary=progressSummary(state,activity);
      return <div className="circuit-card" key={activity} id={`progress-${activity}`}>
        <div className="circuit-heading"><WorkspaceIcon name="compass"/><h3>{activity==='tawaf'?t.tawaf:t.sai}</h3><strong className="circuit-count" key={summary.completed}>{summary.completed}<small>/7</small></strong></div>
        <p aria-live="polite">{t.recorded}: <bdi>{summary.completed} / 7</bdi> · {t.remaining}: <bdi>{summary.remaining}</bdi></p>
        <div className="circuit-track" aria-hidden="true">{Array.from({length:7},(_,index)=><span key={index} className={index<summary.completed?'complete':''}>{index+1}</span>)}</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="primary-button" disabled={!ready||summary.uncertain||summary.completed===7} onClick={()=>setState(previous=>{const current=progressSummary(previous,activity);return current.uncertain||current.completed===7?previous:recordProgress(previous,activity,'completed');})}>{t.completed}</button>
          <button disabled={!ready||!state.events.some(event=>event.activity===activity)} onClick={()=>setState(previous=>undoProgress(previous,activity))}>{t.undo}</button>
          <button disabled={!ready||summary.uncertain} onClick={()=>setState(previous=>progressSummary(previous,activity).uncertain?previous:recordProgress(previous,activity,'uncertain'))}>{t.unsure}</button>
          <button disabled={!ready} onClick={event=>{resetTrigger.current=event.currentTarget;setResetting(activity);}}>{t.reset}</button>
        </div>
        {summary.uncertain&&<p role="status">{t.doubt}</p>}
        {summary.countRecorded&&<p>{t.seven}</p>}
      </div>;
    })}</div>
    {resetting&&<dialog ref={resetDialog} className="share-dialog" aria-labelledby="counter-reset-title" onCancel={()=>setResetting(null)}>
      <h2 id="counter-reset-title">{t.confirm}</h2>
      <p>{resetting==='tawaf'?t.tawaf:t.sai}</p>
      <div className="report-actions">
        <button autoFocus type="button" onClick={()=>setResetting(null)}>{workspaceCopy(language).close}</button>
        <button type="button" onClick={()=>{setState(previous=>resetProgress(previous,resetting));setResetting(null);}}>{t.reset}</button>
      </div>
    </dialog>}
    {!saved&&<p role="status">{t.saveFailed}</p>}
    <p><a href={PROGRESS_REFERENCE.url} target="_blank" rel="noopener noreferrer">{t.reference} ↗</a></p>
    <p>{t.boundary}</p>
  </section>;
}

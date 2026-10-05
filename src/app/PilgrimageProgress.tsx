'use client';
import {useEffect,useState} from 'react';
import {createProgress,progressSummary,recordProgress,undoProgress,resetProgress,restoreProgress,PROGRESS_REFERENCE,type PilgrimageActivity} from '@/lib/pilgrimage-progress';
import {progressCopy} from '@/lib/progress-copy';
import type {DisplayLanguage} from '@/lib/display-copy';
const STORAGE_KEY='isnadlens-pilgrimage-progress-v1';
export function PilgrimageProgress({language}:{language:DisplayLanguage}) {
  const t=progressCopy(language);
  const [state,setState]=useState(createProgress);
  const [ready,setReady]=useState(false);
  const [saved,setSaved]=useState(true);
  useEffect(()=>{try{const stored=localStorage.getItem(STORAGE_KEY);if(stored){const resumed=restoreProgress(stored);if(resumed)setState(resumed);else setSaved(false);}}catch{setSaved(false);}setReady(true);},[]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setSaved(true);}catch{setSaved(false);}},[state,ready]);
  return <section id="journey-counting" className="coverage-box journey-progress" aria-label={t.counter}>
    <h2>{t.heading}</h2>
    <p>{t.intro}</p>
    <div className="desk-grid">{(['tawaf','sai'] as PilgrimageActivity[]).map(activity=>{
      const summary=progressSummary(state,activity);
      return <div className="circuit-card" key={activity} id={`progress-${activity}`}>
        <h3>{activity==='tawaf'?t.tawaf:t.sai}</h3>
        <p aria-live="polite">{t.recorded}: <bdi>{summary.completed} / 7</bdi> · {t.remaining}: <bdi>{summary.remaining}</bdi></p>
        <div className="circuit-track" aria-hidden="true">{Array.from({length:7},(_,index)=><span key={index} className={index<summary.completed?'complete':''}>{index+1}</span>)}</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="primary-button" disabled={!ready||summary.uncertain||summary.completed===7} onClick={()=>setState(previous=>{const current=progressSummary(previous,activity);return current.uncertain||current.completed===7?previous:recordProgress(previous,activity,'completed');})}>{t.completed}</button>
          <button disabled={!ready||!state.events.some(event=>event.activity===activity)} onClick={()=>setState(previous=>undoProgress(previous,activity))}>{t.undo}</button>
          <button disabled={!ready||summary.uncertain} onClick={()=>setState(previous=>progressSummary(previous,activity).uncertain?previous:recordProgress(previous,activity,'uncertain'))}>{t.unsure}</button>
          <button disabled={!ready} onClick={()=>{if(window.confirm(t.confirm))setState(previous=>resetProgress(previous,activity));}}>{t.reset}</button>
        </div>
        {summary.uncertain&&<p role="status">{t.doubt}</p>}
        {summary.countRecorded&&<p>{t.seven}</p>}
      </div>;
    })}</div>
    {!saved&&<p role="status">{t.saveFailed}</p>}
    <p><a href={PROGRESS_REFERENCE.url} target="_blank" rel="noopener noreferrer">{t.reference} ↗</a></p>
    <p>{t.boundary}</p>
  </section>;
}

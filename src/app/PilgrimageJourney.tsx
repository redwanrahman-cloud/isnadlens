'use client';
import {journeyTopic,journeyNotes} from '@/lib/journey-locales';
import {WorkspaceIcon} from './components/WorkspaceIcon';
import {useState} from 'react';
import {HAJJ_TOPICS,UMRAH_TOPICS} from '@/lib/pilgrimage-journey';
import {journeyCopy} from '@/lib/progress-copy';
import type {DisplayLanguage} from '@/lib/display-copy';
export function PilgrimageJourney({language,onQuestion}:{language:DisplayLanguage;onQuestion:(question:string)=>void}){
  const notes=journeyNotes(language);const t=journeyCopy(language);const [ritual,setRitual]=useState<'umrah'|'hajj'>('umrah');const [selected,setSelected]=useState('ihram');
  const topics=ritual==='umrah'?UMRAH_TOPICS:HAJJ_TOPICS;
  const topic=topics.find(item=>item.id===selected)??topics[0];
  const localized=journeyTopic(topic,language);
  return <section id="journey-learning" className="coverage-box journey-topics">
    <h2><WorkspaceIcon name="book"/>{t.heading}</h2>
    <label>{t.ritual}<select aria-label={t.ritual} value={ritual} onChange={event=>{const value=event.target.value as typeof ritual;setRitual(value);setSelected(value==='umrah'?'ihram':'forms');}}><option value="umrah">{t.umrah}</option><option value="hajj">{t.hajj}</option></select></label>
    <p>{notes[ritual==='umrah'?0:1]}</p>
    <div className="journey-topic-options" style={{display:'flex',gap:8,flexWrap:'wrap'}}>{topics.map(item=><button key={item.id} type="button" aria-pressed={topic.id===item.id} onClick={()=>setSelected(item.id)}><WorkspaceIcon name={item.counter?"compass":"book"}/>{journeyTopic(item,language).label}</button>)}</div>
    <h3 lang={language}>{localized.label}</h3>
    <p lang={language}>{localized.question}</p>
    <button type="button" className="primary-button" onClick={()=>onQuestion(localized.question)}>{t.question}</button>
    {topic.counter&&<a className="method-link" style={{marginInlineStart:16}} href={`#progress-${topic.counter}`}>{t.counter} ↓</a>}
    <p><a href={topic.reference} target="_blank" rel="noopener noreferrer">{t.reference} ↗</a></p>
    <p>{notes[2]}</p>
    <p><a href={ritual==='umrah'?'https://umrah.nusuk.sa/Journey':'https://hajj.nusuk.sa/Journey'} target="_blank" rel="noopener noreferrer">Nusuk · {t.official} ↗</a></p>
  </section>;
}

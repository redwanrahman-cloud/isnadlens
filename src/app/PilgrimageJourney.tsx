'use client';
import {useState} from 'react';
import {HAJJ_TOPICS,UMRAH_TOPICS} from '@/lib/pilgrimage-journey';
import type {DisplayLanguage} from '@/lib/display-copy';
export function PilgrimageJourney({language,onQuestion}:{language:DisplayLanguage;onQuestion:(question:string)=>void}){
  const ar=language==='ar';const [ritual,setRitual]=useState<'umrah'|'hajj'>('umrah');const [selected,setSelected]=useState('ihram');
  const topics=ritual==='umrah'?UMRAH_TOPICS:HAJJ_TOPICS;
  const topic=topics.find(item=>item.id===selected)??topics[0];
  return <section className="coverage-box">
    <h2>{ar?'اختر موضع سؤالك':'Choose where your question belongs'}</h2>
    <label>{ar?'النسك':'Pilgrimage'}<select aria-label={ar?'النسك':'Pilgrimage'} value={ritual} onChange={event=>{const value=event.target.value as typeof ritual;setRitual(value);setSelected(value==='umrah'?'ihram':'forms');}}><option value="umrah">{ar?'العمرة':'Umrah'}</option><option value="hajj">{ar?'الحج':'Hajj'}</option></select></label>
    <p>{ritual==='umrah'?(ar?'تنقّل بين موضوعات العمرة، ثم افحص سؤالك بالأدلة.':'Explore the Umrah topics, then examine your question against the evidence.'):(ar?'هذه موضوعات للتعلّم، وليست ترتيباً ملزماً لجميع أنواع الحج. التمتع والقران والإفراد تختلف في بعض الأعمال والتوقيت.':'These are learning topics, not a mandatory sequence for every form of Hajj. Tamattu, Qiran and Ifrad differ in some actions and timing.')}</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{topics.map(item=><button key={item.id} type="button" aria-pressed={topic.id===item.id} onClick={()=>setSelected(item.id)}>{ar?item.label_ar:item.label_en}</button>)}</div>
    <h3>{ar?topic.label_ar:topic.label_en}</h3>
    <p>{ar?topic.question_ar:topic.question_en}</p>
    <button type="button" className="primary-button" onClick={()=>onQuestion(ar?topic.question_ar:topic.question_en)}>{ar?'ضع السؤال في أداة الفحص':'Put this question in the evidence tool'}</button>
    {topic.counter&&<a className="method-link" style={{marginInlineStart:16}} href={`#progress-${topic.counter}`}>{ar?'افتح العداد':'Open counter'} ↓</a>}
    <p><a href={topic.reference} target="_blank" rel="noopener noreferrer">{ar?'افتح المرجع الأصلي':'Open original reference'} ↗</a></p>
    <p>{ar?'اختيار موضوع لا يسجل إتمام النسك ولا يصدر حكماً على حالتك. عداد الطواف يسجل جلسة واحدة؛ امسحه باختيارك قبل طواف آخر.':'Selecting a topic does not record ritual completion or issue a ruling on your situation. The Tawaf counter tracks one session; reset it yourself before another Tawaf.'}</p>
    <p><a href={ritual==='umrah'?'https://umrah.nusuk.sa/Journey':'https://hajj.nusuk.sa/Journey'} target="_blank" rel="noopener noreferrer">Nusuk · {ar?'دليل الرحلة الرسمي':'official journey reference'} ↗</a></p>
  </section>;
}

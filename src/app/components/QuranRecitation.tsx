'use client';
import {useEffect,useRef,useState} from 'react';
import {recitationUrl} from '@/lib/quran-recitation';
import {passageVoiceCopy} from '@/lib/display-copy';
import type {DisplayLanguage} from '@/lib/display-copy';
import {WorkspaceIcon} from './WorkspaceIcon';
const labels:Record<DisplayLanguage,string>={ar:'استمع إلى التلاوة',en:'Listen to recitation',bn:'তিলাওয়াত শুনুন',hi:'तिलावत सुनें',ur:'تلاوت سنیں',id:'Dengarkan tilawah',es:'Escuchar recitación',fr:'Écouter la récitation',de:'Rezitation anhören'};
export function QuranRecitation({sourceId,locator,language}:{sourceId:string;locator:string;language:DisplayLanguage}){
 const url=recitationUrl(sourceId,locator);const audio=useRef<HTMLAudioElement>(null);const owner=useRef(Symbol('recitation'));const [playing,setPlaying]=useState(false);const [failed,setFailed]=useState(false);
 useEffect(()=>{const stop=(e:Event)=>{if(e instanceof CustomEvent&&e.detail===owner.current)return;audio.current?.pause();setPlaying(false);};window.addEventListener('isnadlens:speech-cancel',stop);return()=>{window.removeEventListener('isnadlens:speech-cancel',stop);audio.current?.pause();};},[]);
 useEffect(()=>{audio.current?.pause();setPlaying(false);setFailed(false);},[url]);
 if(!url)return null;
 async function toggle(){if(!audio.current)return;if(playing){audio.current.pause();setPlaying(false);return;}window.dispatchEvent(new CustomEvent('isnadlens:speech-cancel',{detail:owner.current}));if(failed)audio.current.load();setFailed(false);try{await audio.current.play();setPlaying(true);}catch{setFailed(true);}}
 return <div className="recitation-player"><button className={`audio-icon-button recitation-icon-button${playing?' is-active':''}`} type="button" aria-label={playing?passageVoiceCopy[language].stop:labels[language]} title={playing?passageVoiceCopy[language].stop:labels[language]} aria-pressed={playing} onClick={()=>void toggle()}><WorkspaceIcon name={playing?'stop':'play'}/></button><audio ref={audio} src={url} preload="none" onEnded={()=>setPlaying(false)} onError={()=>{setPlaying(false);setFailed(true);}}/><small>{language==='ar'?'مشاري راشد العفاسي · الآية كاملة':'Mishary Rashid Alafasy · full verse'} <bdi>{locator}</bdi> · <a href="https://everyayah.com/" target="_blank" rel="noopener noreferrer">EveryAyah ↗</a></small>{failed&&<small role="status">{language==='ar'?'تعذر تحميل التلاوة. حاول مرة أخرى.':'Recitation could not load. Tap to try again.'}</small>}</div>;
}

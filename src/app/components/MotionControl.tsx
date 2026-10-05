'use client';
import {useEffect,useState} from 'react';
import type {DisplayLanguage} from '@/lib/display-copy';
import {WorkspaceIcon} from './WorkspaceIcon';
const labels={ar:['إيقاف الحركة','تشغيل الحركة'],en:['Pause motion','Enable motion'],bn:['অ্যানিমেশন বন্ধ','অ্যানিমেশন চালু'],hi:['गतियाँ रोकें','गतियाँ चालू करें'],ur:['حرکت روکیں','حرکت چلائیں'],id:['Jeda animasi','Aktifkan animasi'],es:['Pausar animaciones','Activar animaciones'],fr:['Suspendre les animations','Activer les animations'],de:['Animationen pausieren','Animationen aktivieren']};
export function MotionControl({language}:{language:DisplayLanguage}){
 const [paused,setPaused]=useState(false);
 useEffect(()=>{try{setPaused(localStorage.getItem('isnadlens:motion')==='paused');}catch{}},[]);
 useEffect(()=>{document.documentElement.dataset.motion=paused?'paused':'enabled';},[paused]);
 return <button type="button" className="studio-motion" aria-label={labels[language][paused?1:0]} title={labels[language][paused?1:0]} aria-pressed={paused} onClick={()=>{const next=!paused;setPaused(next);try{localStorage.setItem('isnadlens:motion',next?'paused':'enabled');}catch{}}}><WorkspaceIcon name={paused?'play':'spark'}/></button>;
}

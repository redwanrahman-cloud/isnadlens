'use client';

import {useEffect, useRef, useState} from 'react';
import {matchingVoices, speechChunks} from '@/lib/speech';
import {WorkspaceIcon} from './components/WorkspaceIcon';
import {passageVoiceCopy, type DisplayLanguage} from '@/lib/display-copy';

// Each instance owns its session. Starting another reader cancels the previous one.
let currentOwner: symbol | undefined;
const cancelEvent = 'isnadlens:speech-cancel';
type ReaderProps={text:string;spokenLanguage:string;language:DisplayLanguage};
type CloudCopy={reader:string;natural:string;device:string;preparing:string;unavailable:string;remote:string;play:string;voice:string};
const cloudCopy:Record<DisplayLanguage,CloudCopy>={
 en:{reader:'Read-aloud voice',natural:'Google natural voice',device:'Device voice',preparing:'Preparing audio…',unavailable:'Natural voice is temporarily unavailable. You can use the device reader.',remote:'Google generates this audio online; its free service may use the text to improve its products.',play:'Play prepared audio',voice:'Voice'},
 ar:{reader:'صوت القراءة',natural:'صوت Google الطبيعي',device:'صوت الجهاز',preparing:'جارٍ إعداد الصوت…',unavailable:'الصوت الطبيعي غير متاح مؤقتاً. يمكنك استخدام قارئ الجهاز.',remote:'ينشئ Google هذا الصوت عبر الإنترنت؛ قد تستخدم خدمته المجانية النص لتحسين منتجاتها.',play:'شغّل الصوت الجاهز',voice:'الصوت'},
 bn:{reader:'পাঠের কণ্ঠ',natural:'Google-এর স্বাভাবিক কণ্ঠ',device:'যন্ত্রের কণ্ঠ',preparing:'অডিও তৈরি হচ্ছে…',unavailable:'স্বাভাবিক কণ্ঠ এখন নেই। যন্ত্রের পাঠক ব্যবহার করতে পারেন।',remote:'Google অনলাইনে অডিও তৈরি করে; বিনামূল্যের পরিষেবা পণ্য উন্নত করতে পাঠ ব্যবহার করতে পারে।',play:'প্রস্তুত অডিও চালান',voice:'কণ্ঠ'},
 hi:{reader:'पढ़ने की आवाज़',natural:'Google की स्वाभाविक आवाज़',device:'उपकरण की आवाज़',preparing:'ऑडियो तैयार हो रहा है…',unavailable:'स्वाभाविक आवाज़ अभी उपलब्ध नहीं। उपकरण का पाठक इस्तेमाल कर सकते हैं।',remote:'Google यह ऑडियो ऑनलाइन बनाता है; उसकी मुफ्त सेवा उत्पाद सुधारने के लिए पाठ इस्तेमाल कर सकती है।',play:'तैयार ऑडियो चलाएँ',voice:'आवाज़'},
 ur:{reader:'پڑھنے کی آواز',natural:'Google کی قدرتی آواز',device:'آلے کی آواز',preparing:'آڈیو تیار ہو رہی ہے…',unavailable:'قدرتی آواز فی الحال دستیاب نہیں۔ آلے کا قاری استعمال کر سکتے ہیں۔',remote:'Google یہ آڈیو آن لائن بناتا ہے؛ مفت خدمت مصنوعات بہتر بنانے کے لیے متن استعمال کر سکتی ہے۔',play:'تیار آڈیو چلائیں',voice:'آواز'},
 id:{reader:'Suara pembaca',natural:'Suara alami Google',device:'Suara perangkat',preparing:'Menyiapkan audio…',unavailable:'Suara alami sementara tidak tersedia. Gunakan pembaca perangkat.',remote:'Google membuat audio ini secara online; layanan gratisnya dapat memakai teks untuk meningkatkan produknya.',play:'Putar audio yang siap',voice:'Suara'},
 es:{reader:'Voz de lectura',natural:'Voz natural de Google',device:'Voz del dispositivo',preparing:'Preparando audio…',unavailable:'La voz natural no está disponible temporalmente. Puedes usar la voz del dispositivo.',remote:'Google genera este audio en línea; su servicio gratuito puede usar el texto para mejorar sus productos.',play:'Reproducir audio preparado',voice:'Voz'},
 fr:{reader:'Voix de lecture',natural:'Voix naturelle Google',device:'Voix de l’appareil',preparing:'Préparation de l’audio…',unavailable:'La voix naturelle est temporairement indisponible. Utilisez la voix de l’appareil.',remote:'Google génère cet audio en ligne ; son service gratuit peut utiliser le texte pour améliorer ses produits.',play:'Lire l’audio préparé',voice:'Voix'},
 de:{reader:'Vorlesestimme',natural:'Natürliche Google-Stimme',device:'Gerätestimme',preparing:'Audio wird vorbereitet…',unavailable:'Die natürliche Stimme ist vorübergehend nicht verfügbar. Nutze die Gerätestimme.',remote:'Google erzeugt dieses Audio online; der kostenlose Dienst kann den Text zur Produktverbesserung verwenden.',play:'Vorbereitetes Audio abspielen',voice:'Stimme'},
};

const aboutAudio:Record<DisplayLanguage,string>={ar:'عن الصوت',en:'About audio',bn:'অডিও সম্পর্কে',hi:'ऑडियो के बारे में',ur:'آڈیو کے بارے میں',id:'Tentang audio',es:'Acerca del audio',fr:'À propos de l’audio',de:'Über die Audiowiedergabe'};
let readiness:Promise<boolean>|undefined;
export function SpeechPlayer({text,spokenLanguage,language}:ReaderProps){
 const [ready,setReady]=useState(false);const [state,setState]=useState<'idle'|'preparing'|'playing'|'paused'|'failed'>('idle');
 const audio=useRef<HTMLAudioElement>(null);const retainedUrl=useRef('');const request=useRef<AbortController|null>(null);const generation=useRef(0);const owner=useRef(Symbol('reader'));
 const copy=cloudCopy[language],t=passageVoiceCopy[language];
 function cancel(){generation.current++;request.current?.abort();audio.current?.pause();if(currentOwner===owner.current&&'speechSynthesis'in window)window.speechSynthesis.cancel();setState('idle');}
 useEffect(()=>{let mounted=true;readiness??=fetch('/api/speech').then(r=>r.ok?r.json():null).then(d=>Boolean(d?.available)).catch(()=>false);readiness.then(v=>{if(mounted)setReady(v);});return()=>{mounted=false;};},[]);
 useEffect(()=>{function other(e:Event){if(e instanceof CustomEvent&&e.detail===owner.current)return;cancel();}window.addEventListener(cancelEvent,other);return()=>{window.removeEventListener(cancelEvent,other);cancel();if(retainedUrl.current)URL.revokeObjectURL(retainedUrl.current);};},[]);
 useEffect(()=>{cancel();if(retainedUrl.current)URL.revokeObjectURL(retainedUrl.current);retainedUrl.current='';audio.current?.removeAttribute('src');},[text,spokenLanguage]);
 function device(session:number){
  if(!('speechSynthesis'in window)){setState('failed');return;}
  currentOwner=owner.current;const available=matchingVoices(window.speechSynthesis.getVoices(),spokenLanguage);const voice=available.find(v=>v.default)||available[0];const chunks=speechChunks(text);let index=0;
  function next(){if(generation.current!==session||currentOwner!==owner.current)return;if(index===chunks.length){setState('idle');return;}const utterance=new SpeechSynthesisUtterance(chunks[index++]);utterance.lang=spokenLanguage;if(voice)utterance.voice=voice;utterance.rate=0.95;utterance.onend=next;utterance.onerror=()=>{if(generation.current===session)setState('failed');};setState('playing');window.speechSynthesis.speak(utterance);}next();
 }
 async function play(){
  if(state==='preparing'||state==='playing'){cancel();return;}
  window.dispatchEvent(new CustomEvent(cancelEvent,{detail:owner.current}));if('speechSynthesis'in window)window.speechSynthesis.cancel();currentOwner=owner.current;const session=++generation.current;
  if(retainedUrl.current&&audio.current){try{await audio.current.play();setState('playing');}catch{setState('paused');}return;}
  if(!ready||text.length>2400){device(session);return;}
  setState('preparing');const c=new AbortController();request.current=c;
  try{const r=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:spokenLanguage.split(/[-_]/)[0],voice:'Algieba'}),signal:c.signal});if(!r.ok||!r.headers.get('Content-Type')?.includes('audio/wav'))throw new Error('unavailable');const blob=await r.blob();if(generation.current!==session)return;retainedUrl.current=URL.createObjectURL(blob);if(!audio.current)return;audio.current.src=retainedUrl.current;try{await audio.current.play();if(generation.current===session)setState('playing');}catch{if(generation.current===session)setState('paused');}}
  catch{if(generation.current===session&&!c.signal.aborted)device(session);}
 }
 const active=state==='playing'||state==='preparing';const label=active?t.stop:t.listen;
 return <div className="speech-reader speech-controls"><button className={`audio-icon-button${active?' is-active':''}${state==='preparing'?' is-preparing':''}`} type="button" aria-label={label} title={label} aria-pressed={active} onClick={()=>void play()} disabled={!text.trim()}><WorkspaceIcon name={active?'stop':'speaker'}/></button><audio ref={audio} preload="none" onEnded={()=>setState('idle')} onError={()=>{if(state==='playing')device(generation.current);}}/>{state==='preparing'&&<small role="status">{copy.preparing}</small>}{state==='paused'&&<small role="status">{copy.play}</small>}{state==='failed'&&<small role="status">{t.unavailableVoice}</small>}<details className="reader-info"><summary>{aboutAudio[language]}</summary><small>{t.synthesizedNotRecitation}</small>{ready&&<small>{copy.remote}</small>}</details></div>;
}

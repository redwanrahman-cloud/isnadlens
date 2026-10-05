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
let readiness:Promise<boolean>|undefined;
export function SpeechPlayer(props:ReaderProps){
  const [ready,setReady]=useState(false);const [mode,setMode]=useState<'natural'|'device'>('device');
  const copy=cloudCopy[props.language];
  useEffect(()=>{let mounted=true;readiness??=fetch('/api/speech').then(response=>response.ok?response.json():null).then(data=>Boolean(data?.available)).catch(()=>false);readiness.then(value=>{if(mounted){setReady(value);if(value)setMode('natural');}});return()=>{mounted=false;};},[]);
  return <details className="speech-reader" style={{maxWidth:'100%'}}><summary><WorkspaceIcon name="voice"/>{passageVoiceCopy[props.language].listen}</summary><div>
    {ready&&<label style={{display:'block',maxWidth:'100%'}}>{copy.reader}<select style={{display:'block',maxWidth:'100%'}} value={mode} onChange={event=>{window.dispatchEvent(new Event(cancelEvent));setMode(event.target.value as 'natural'|'device');}}><option value="natural">{copy.natural}</option><option value="device">{copy.device}</option></select></label>}
    {mode==='natural'&&ready?<NaturalSpeechPlayer {...props}/>:<DeviceSpeechPlayer {...props}/>}
  </div></details>;
}
function NaturalSpeechPlayer({text,spokenLanguage,language}:ReaderProps){
  const [voice,setVoice]=useState('Achernar');const [url,setUrl]=useState('');const [preparing,setPreparing]=useState(false);const [failed,setFailed]=useState(false);
  const audio=useRef<HTMLAudioElement|null>(null);const request=useRef<AbortController|null>(null);const generation=useRef(0);const retainedUrl=useRef('');const identity=useRef(Symbol('natural-speech'));
  const copy=cloudCopy[language];const speechCopy=passageVoiceCopy[language];
  useEffect(()=>{const cancel=(event?:Event)=>{if(event instanceof CustomEvent&&event.detail===identity.current)return;generation.current++;request.current?.abort();audio.current?.pause();setPreparing(false);};window.addEventListener(cancelEvent,cancel);return()=>{window.removeEventListener(cancelEvent,cancel);cancel();if(retainedUrl.current)URL.revokeObjectURL(retainedUrl.current);};},[]);
  useEffect(()=>{generation.current++;request.current?.abort();audio.current?.pause();if(retainedUrl.current)URL.revokeObjectURL(retainedUrl.current);retainedUrl.current='';setUrl('');setPreparing(false);setFailed(false);},[text,spokenLanguage,voice]);
  async function prepare(){
    window.dispatchEvent(new Event(cancelEvent));if('speechSynthesis'in window)window.speechSynthesis.cancel();
    const session=++generation.current;const controller=new AbortController();request.current=controller;setPreparing(true);setFailed(false);
    try{
      const response=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:spokenLanguage.split(/[-_]/)[0],voice}),signal:controller.signal});
      if(!response.ok||!response.headers.get('Content-Type')?.includes('audio/wav'))throw new Error('SPEECH_UNAVAILABLE');
      const blob=await response.blob();if(generation.current!==session)return;
      if(retainedUrl.current)URL.revokeObjectURL(retainedUrl.current);const next=URL.createObjectURL(blob);retainedUrl.current=next;setUrl(next);setPreparing(false);
      // Keep native audio controls visible: mobile browsers may require a second user tap after async generation.
    }catch{if(generation.current===session){setPreparing(false);setFailed(true);}}
  }
  return <div className="speech-controls" style={{maxWidth:'100%'}}>
    <label style={{display:'block',maxWidth:'100%'}}>{copy.voice}<select style={{display:'block',maxWidth:'100%'}} value={voice} onChange={event=>setVoice(event.target.value)}><option value="Achernar">Achernar</option><option value="Algieba">Algieba</option><option value="Sulafat">Sulafat</option></select></label>
    {!url&&<button type="button" onClick={preparing?()=>{generation.current++;request.current?.abort();setPreparing(false);}:prepare} disabled={!text.trim()||text.length>2400}>{preparing?speechCopy.stop:speechCopy.listen}</button>}
    {preparing&&<p role="status">{copy.preparing}</p>}
    {url&&<audio ref={audio} src={url} controls preload="metadata" aria-label={copy.play} style={{display:'block',width:'100%',maxWidth:'100%'}} onPlay={()=>{window.dispatchEvent(new CustomEvent(cancelEvent,{detail:identity.current}));if('speechSynthesis'in window)window.speechSynthesis.cancel();}}/>}
    <small>{speechCopy.synthesizedNotRecitation}</small><small>{copy.remote}</small>
    {(failed||text.length>2400)&&<p role="status">{copy.unavailable}</p>}
  </div>;
}
function DeviceSpeechPlayer({text, spokenLanguage, language}: ReaderProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [voiceURI, setVoiceURI] = useState('');
  const owner = useRef(Symbol('speech'));
  const generation = useRef(0);
  const retainedUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const copy = passageVoiceCopy[language];
  useEffect(() => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    setSupported(true);
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(synth.getVoices());
    const cancelled = () => { generation.current++; retainedUtterance.current = null; setPlaying(false); };
    refresh(); synth.addEventListener('voiceschanged', refresh);
    window.addEventListener(cancelEvent, cancelled);
    const identity = owner.current;
    return () => {
      synth.removeEventListener('voiceschanged', refresh); window.removeEventListener(cancelEvent, cancelled);
      generation.current++;
      if (currentOwner === identity) { synth.cancel(); currentOwner = undefined; }
      retainedUtterance.current = null;
    };
  }, []);
  useEffect(() => {
    generation.current++; setPlaying(false); setFailed(false);
    if (currentOwner === owner.current && 'speechSynthesis' in window) { window.speechSynthesis.cancel(); currentOwner = undefined; }
    retainedUtterance.current = null;
  }, [text, spokenLanguage]);
  const available = matchingVoices(voices, spokenLanguage);
  const selected = available.find(voice => voice.voiceURI === voiceURI) || available[0];
  function stop() {
    generation.current++; setPlaying(false); retainedUtterance.current = null;
    if (currentOwner === owner.current) { window.speechSynthesis.cancel(); currentOwner = undefined; }
  }
  function start() {
    if (!selected || !text.trim()) return;
    // Cancellation and the first speak call stay inside the user gesture for mobile browsers.
    window.dispatchEvent(new Event(cancelEvent));
    window.speechSynthesis.cancel(); currentOwner = owner.current;
    const session = ++generation.current;
    const chunks = speechChunks(text); let index = 0;
    setFailed(false); setPlaying(true);
    function next() {
      if (generation.current !== session || currentOwner !== owner.current) return;
      if (index >= chunks.length) { setPlaying(false); retainedUtterance.current = null; currentOwner = undefined; return; }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]);
      utterance.lang = selected.lang; utterance.voice = selected; utterance.rate = 0.95;
      utterance.onend = next;
      utterance.onerror = event => {
        if (generation.current !== session) return;
        setPlaying(false); setFailed(event.error !== 'canceled' && event.error !== 'interrupted');
        retainedUtterance.current = null; if (currentOwner === owner.current) currentOwner = undefined;
      };
      retainedUtterance.current = utterance; window.speechSynthesis.speak(utterance);
    }
    next();
  }
  return <div className="speech-controls">
    <button type="button" onClick={playing ? stop : start} disabled={!supported || !selected || !text.trim()}>{playing ? copy.stop : copy.listen}</button>
    {available.length > 1 && <label style={{display:'block',maxWidth:'100%'}}>{copy.voice} <select style={{display:'block',maxWidth:'100%'}} value={selected?.voiceURI || ''} onChange={event => {stop(); setVoiceURI(event.target.value);}}>{available.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label>}
    <small>{copy.synthesizedNotRecitation}</small>
    {selected && !selected.localService && <small>{copy.remoteVoiceNotice}</small>}
    {(!supported || !selected || failed) && <p role="status">{copy.unavailableVoice}</p>}
  </div>;
}

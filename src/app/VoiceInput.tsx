'use client';
import {interfaceText} from '@/lib/interface-copy';
import {useEffect,useRef,useState,useImperativeHandle,forwardRef} from 'react';
import {WorkspaceIcon} from './components/WorkspaceIcon';
import type {ClaimInputSelection,ClaimLanguage} from '@/lib/claim-language';
const words:Record<ClaimLanguage,string[]>={
 en:['Voice input','Record','Stop','Transcribe','Use this text','Discard','Review and edit before verification. Recording is limited to 45 seconds. Google receives audio only when you press Transcribe; its free service may use audio to improve its products. Avoid private information.','Microphone or recording is unavailable. You can still type.','Speech could not be transcribed. Try a shorter, clearer recording or type.','Transcribing…','Review the transcript','Recording…','Free voice input is unavailable. You can still type.'],
 ar:['إدخال صوتي','سجّل','إيقاف','تحويل إلى نص','استخدم النص','حذف التسجيل','راجع النص قبل التحقق. مدة التسجيل 45 ثانية كحد أقصى. يُرسل الصوت إلى Google فقط عند ضغط تحويل إلى نص، وقد تستخدمه الخدمة المجانية لتحسين منتجاتها. تجنب المعلومات الخاصة.','الميكروفون أو التسجيل غير متاح. يمكنك الكتابة.','تعذر تحويل الصوت إلى نص. جرّب تسجيلاً أقصر وأوضح أو اكتب.','جارٍ تحويل الصوت…','راجع النص','جارٍ التسجيل…','الإدخال الصوتي المجاني غير متاح. يمكنك الكتابة.'],
 bn:['ভয়েস ইনপুট','রেকর্ড','থামান','লিখিত পাঠে রূপান্তর','এই পাঠ ব্যবহার করুন','বাতিল','যাচাইয়ের আগে পাঠ পর্যালোচনা করুন। সর্বোচ্চ ৪৫ সেকেন্ড। রূপান্তর চাপলে অডিও Google-এ পাঠানো হবে; বিনামূল্যের পরিষেবা পণ্য উন্নয়নে তা ব্যবহার করতে পারে। ব্যক্তিগত তথ্য বলবেন না।','মাইক্রোফোন বা রেকর্ডিং নেই। লিখতে পারেন।','অডিও রূপান্তর করা যায়নি। সংক্ষিপ্ত ও স্পষ্টভাবে বলুন বা লিখুন।','রূপান্তর হচ্ছে…','পাঠ পর্যালোচনা করুন','রেকর্ড হচ্ছে…','বিনামূল্যের ভয়েস ইনপুট নেই। লিখতে পারেন।'],
 hi:['आवाज़ से लिखें','रिकॉर्ड','रोकें','लिखित पाठ बनाएँ','यह पाठ इस्तेमाल करें','हटाएँ','सत्यापन से पहले पाठ जाँचें। अधिकतम 45 सेकंड। लिखित पाठ बनाएँ दबाने पर ही ऑडियो Google को भेजा जाता है; निःशुल्क सेवा उत्पाद सुधार के लिए इसका उपयोग कर सकती है। निजी जानकारी न बोलें।','माइक्रोफ़ोन या रिकॉर्डिंग उपलब्ध नहीं। आप लिख सकते हैं।','आवाज़ समझ नहीं आई। छोटा और स्पष्ट रिकॉर्ड करें या लिखें।','पाठ बन रहा है…','पाठ जाँचें','रिकॉर्ड हो रहा है…','निःशुल्क आवाज़ सुविधा उपलब्ध नहीं। लिख सकते हैं।'],
 ur:['آواز سے لکھیں','ریکارڈ','روکیں','متن بنائیں','یہ متن استعمال کریں','حذف کریں','تصدیق سے پہلے متن دیکھیں۔ زیادہ سے زیادہ 45 سیکنڈ۔ متن بنائیں دبانے پر ہی آڈیو Google کو بھیجی جاتی ہے؛ مفت سروس اسے مصنوعات بہتر بنانے کے لیے استعمال کر سکتی ہے۔ نجی معلومات نہ دیں۔','مائیکروفون یا ریکارڈنگ دستیاب نہیں۔ لکھ سکتے ہیں۔','آواز کا متن نہیں بن سکا۔ مختصر اور واضح ریکارڈ کریں یا لکھیں۔','متن بن رہا ہے…','متن دیکھیں','ریکارڈ ہو رہا ہے…','مفت صوتی سہولت دستیاب نہیں۔ لکھ سکتے ہیں۔'],
 id:['Masukan suara','Rekam','Berhenti','Transkripsikan','Gunakan teks ini','Buang','Tinjau teks sebelum verifikasi. Maksimal 45 detik. Audio dikirim ke Google hanya saat menekan Transkripsikan; layanan gratis dapat memakainya untuk meningkatkan produk. Hindari informasi pribadi.','Mikrofon atau perekaman tidak tersedia. Anda masih bisa mengetik.','Audio tidak dapat ditranskripsikan. Rekam lebih singkat dan jelas atau ketik.','Mentranskripsikan…','Tinjau transkrip','Merekam…','Masukan suara gratis tidak tersedia. Anda masih bisa mengetik.'],
 es:['Entrada de voz','Grabar','Detener','Transcribir','Usar este texto','Descartar','Revisa el texto antes de verificar. Máximo 45 segundos. El audio se envía a Google solo al pulsar Transcribir; el servicio gratuito puede usarlo para mejorar sus productos. Evita información privada.','Micrófono o grabación no disponible. Puedes escribir.','No se pudo transcribir. Graba más breve y claro o escribe.','Transcribiendo…','Revisar transcripción','Grabando…','Entrada de voz gratuita no disponible. Puedes escribir.'],
 fr:['Saisie vocale','Enregistrer','Arrêter','Transcrire','Utiliser ce texte','Supprimer','Relisez avant vérification. Maximum 45 secondes. Google reçoit le son uniquement après Transcrire ; le service gratuit peut l’utiliser pour améliorer ses produits. Évitez les informations privées.','Microphone ou enregistrement indisponible. Vous pouvez écrire.','Transcription impossible. Enregistrez plus brièvement et clairement ou écrivez.','Transcription…','Relire la transcription','Enregistrement…','Saisie vocale gratuite indisponible. Vous pouvez écrire.'],
 de:['Spracheingabe','Aufnehmen','Stoppen','Transkribieren','Diesen Text verwenden','Verwerfen','Vor der Prüfung den Text kontrollieren. Höchstens 45 Sekunden. Audio wird erst bei Transkribieren an Google gesendet; der kostenlose Dienst kann es zur Produktverbesserung nutzen. Keine privaten Angaben.','Mikrofon oder Aufnahme nicht verfügbar. Sie können tippen.','Transkription fehlgeschlagen. Kürzer und deutlicher aufnehmen oder tippen.','Transkription…','Transkript prüfen','Aufnahme…','Kostenlose Spracheingabe nicht verfügbar. Sie können tippen.']};
const automaticCopy:Record<ClaimLanguage,[string,string]>={
 en:['Speak, then stop. Your words appear in the question box for editing before you examine the evidence.','Up to 45 seconds. Stopping sends the recording to Google for transcription; its free service may use audio to improve its products.'],
 ar:['تحدث ثم اضغط إيقاف. يوضع النص تلقائياً في السؤال لتعديله قبل الفحص.','45 ثانية كحد أقصى. عند الإيقاف يُرسل التسجيل إلى Google لتحويله إلى نص؛ قد تستخدم الخدمة المجانية الصوت لتحسين منتجاتها.'],
 bn:['কথা বলুন, তারপর থামান। যাচাইয়ের আগে সম্পাদনার জন্য আপনার কথা প্রশ্নের ঘরে আসবে।','সর্বোচ্চ ৪৫ সেকেন্ড। থামালে রেকর্ডিং Google-এ পাঠানো হয়; বিনামূল্যের পরিষেবা পণ্য উন্নয়নে অডিও ব্যবহার করতে পারে।'],
 hi:['बोलें, फिर रोकें। जाँच से पहले संपादन के लिए आपके शब्द प्रश्न में आ जाएँगे।','अधिकतम 45 सेकंड। रोकने पर रिकॉर्डिंग Google को भेजी जाती है; निःशुल्क सेवा उत्पाद सुधार के लिए ऑडियो उपयोग कर सकती है।'],
 ur:['بولیں، پھر روکیں۔ جانچ سے پہلے ترمیم کے لیے آپ کے الفاظ سوال میں آ جائیں گے۔','زیادہ سے زیادہ 45 سیکنڈ۔ روکنے پر ریکارڈنگ Google کو بھیجی جاتی ہے؛ مفت خدمت مصنوعات بہتر بنانے کے لیے آڈیو استعمال کر سکتی ہے۔'],
 id:['Bicara, lalu berhenti. Kata-kata Anda masuk ke kotak pertanyaan untuk diedit sebelum memeriksa bukti.','Maksimal 45 detik. Saat berhenti, rekaman dikirim ke Google untuk transkripsi; layanan gratis dapat memakai audio untuk meningkatkan produk.'],
 es:['Habla y detén la grabación. Tus palabras aparecerán en la pregunta para editarlas antes de examinar las pruebas.','Hasta 45 segundos. Al detener, Google recibe la grabación para transcribirla; su servicio gratuito puede usar el audio para mejorar sus productos.'],
 fr:['Parlez, puis arrêtez. Vos mots apparaîtront dans la question pour être relus avant l’examen des preuves.','45 secondes maximum. À l’arrêt, l’enregistrement est envoyé à Google ; son service gratuit peut utiliser le son pour améliorer ses produits.'],
 de:['Sprechen, dann stoppen. Ihre Worte erscheinen im Fragefeld zur Bearbeitung vor der Belegprüfung.','Bis zu 45 Sekunden. Beim Stoppen wird die Aufnahme zur Transkription an Google gesendet; der kostenlose Dienst kann Audio zur Produktverbesserung verwenden.']
};
type Phase='idle'|'starting'|'recording'|'transcribing'|'error';
const openingCopy:Record<ClaimLanguage,string>={en:'Opening microphone…',ar:'جارٍ فتح الميكروفون…',bn:'মাইক্রোফোন চালু হচ্ছে…',hi:'माइक्रोफ़ोन खुल रहा है…',ur:'مائیکروفون کھل رہا ہے…',id:'Membuka mikrofon…',es:'Abriendo el micrófono…',fr:'Ouverture du microphone…',de:'Mikrofon wird geöffnet…'};
const lengthCopy:Record<ClaimLanguage,string>={en:'The combined question exceeds 1,200 characters. Your draft is unchanged. Shorten it before dictating again.',ar:'يتجاوز السؤال 1200 حرف. لم تتغير مسودتك؛ اختصرها قبل الإملاء مجدداً.',bn:'মোট প্রশ্ন ১,২০০ অক্ষরের বেশি। খসড়া অপরিবর্তিত আছে। আবার বলার আগে ছোট করুন।',hi:'पूरा प्रश्न 1,200 अक्षरों से अधिक है। मसौदा सुरक्षित है। फिर बोलने से पहले छोटा करें।',ur:'سوال 1,200 حروف سے بڑھ گیا ہے۔ مسودہ محفوظ ہے؛ دوبارہ بولنے سے پہلے مختصر کریں۔',id:'Pertanyaan melebihi 1.200 karakter. Draf tidak berubah. Persingkat sebelum mendikte lagi.',es:'La pregunta supera los 1.200 caracteres. El borrador sigue intacto. Acórtalo antes de dictar de nuevo.',fr:'La question dépasse 1 200 caractères. Votre brouillon est conservé. Raccourcissez-le avant de dicter à nouveau.',de:'Die Frage überschreitet 1.200 Zeichen. Ihr Entwurf bleibt erhalten. Kürzen Sie ihn vor dem erneuten Diktieren.'};
export type VoiceInputHandle={start:()=>void;cancel:()=>void};
type Props={language:ClaimLanguage;inputLanguage:ClaimInputSelection;disabled:boolean;onText:(text:string)=>boolean;onCancel:()=>void};
export const VoiceInput=forwardRef<VoiceInputHandle,Props>(function VoiceInput({language,inputLanguage,disabled,onText,onCancel},ref){
 const t=words[language],autoCopy=automaticCopy[language];
 const [ready,setReady]=useState<boolean|null>(null),[requested,setRequested]=useState(false);
 const [phase,setPhase]=useState<Phase>('idle');const phaseRef=useRef<Phase>('idle');
 const [error,setError]=useState<''|'mic'|'transcribe'|'length'>('');
 const [seconds,setSeconds]=useState(0),[levels,setLevels]=useState<number[]>(Array(32).fill(3));
 const meter=useRef<AudioContext|null>(null),animation=useRef(0),startedAt=useRef(0);
 const elapsedTimer=useRef<ReturnType<typeof setInterval>|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null);
 const controller=useRef<AbortController|null>(null),generation=useRef(0),stopButton=useRef<HTMLButtonElement>(null),cancelButton=useRef<HTMLButtonElement>(null);
 function move(next:Phase){phaseRef.current=next;setPhase(next);}
 function release(){cancelAnimationFrame(animation.current);if(elapsedTimer.current)clearInterval(elapsedTimer.current);elapsedTimer.current=null;void meter.current?.close().catch(()=>{});meter.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;}
 function discard(){generation.current++;controller.current?.abort();if(recorder.current){recorder.current.onstop=null;if(recorder.current.state!=='inactive')recorder.current.stop();}recorder.current=null;release();setRequested(false);move('idle');setSeconds(0);setLevels(Array(32).fill(3));setError('');}
 function cancel(){discard();onCancel();}
 useEffect(()=>{const c=new AbortController();fetch('/api/transcribe',{signal:c.signal}).then(r=>r.json()).then(data=>{if(!c.signal.aborted)setReady(Boolean(data.available));}).catch(()=>{if(!c.signal.aborted)setReady(false);});return()=>c.abort();},[]);
 useEffect(()=>{if(disabled)discard();else cancelButton.current?.focus({preventScroll:true});},[disabled]);
 useEffect(()=>{if(ready===false)discard();},[ready]);
 useEffect(()=>{if(requested&&ready===true&&!disabled){setRequested(false);void start();}},[requested,ready,disabled]);
 useEffect(()=>{if(phase==='recording')stopButton.current?.focus({preventScroll:true});},[phase]);
 useEffect(()=>()=>{generation.current++;controller.current?.abort();if(recorder.current){recorder.current.onstop=null;if(recorder.current.state!=='inactive')recorder.current.stop();}release();},[]);
 function stop(){if(phaseRef.current!=='recording')return;move('transcribing');if(recorder.current?.state==='recording')recorder.current.stop();}
 async function start(){
  if(disabled||ready!==true||!['idle','error'].includes(phaseRef.current))return;
  window.dispatchEvent(new Event('isnadlens:speech-cancel'));discard();move('starting');const epoch=generation.current;
  try{
   if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw new Error('unsupported');
   try{meter.current=new AudioContext();void meter.current.resume().catch(()=>{});}catch{}
   const media=await navigator.mediaDevices.getUserMedia({audio:true});if(epoch!==generation.current){media.getTracks().forEach(track=>track.stop());return;}stream.current=media;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime)throw new Error('unsupported');
   const r=new MediaRecorder(media,{mimeType:mime,audioBitsPerSecond:32000});recorder.current=r;const chunks:Blob[]=[];let size=0;
   r.ondataavailable=e=>{if(epoch!==generation.current)return;if(e.data.size){chunks.push(e.data);size+=e.data.size;if(size>1_000_000)stop();}};
   r.onerror=()=>{if(epoch!==generation.current)return;discard();move('error');setError('mic');};
   r.onstop=()=>{if(epoch!==generation.current)return;release();move('transcribing');const audio=new Blob(chunks,{type:r.mimeType});if(!audio.size||audio.size>1_000_000){move('error');setError('transcribe');}else void transcribe(audio,epoch);};
   r.start(1000);move('recording');startedAt.current=Date.now();elapsedTimer.current=setInterval(()=>setSeconds(Math.min(45,Math.floor((Date.now()-startedAt.current)/1000))),250);
   try{if(meter.current){const analyser=meter.current.createAnalyser();analyser.fftSize=256;meter.current.createMediaStreamSource(media).connect(analyser);const samples=new Uint8Array(analyser.fftSize);let last=0;
    const draw=(time:number)=>{if(epoch!==generation.current||r.state!=='recording')return;if(time-last>75){last=time;analyser.getByteTimeDomainData(samples);const rms=Math.sqrt(samples.reduce((sum,value)=>sum+((value-128)/128)**2,0)/samples.length);const height=Math.min(30,Math.max(3,rms*160));setLevels(previous=>[...previous.slice(1),height]);}animation.current=requestAnimationFrame(draw);};animation.current=requestAnimationFrame(draw);}}
   catch{/* Keep the level meter flat when audio analysis is unavailable. */}
   timer.current=setTimeout(stop,45000);
  }catch{if(epoch===generation.current){release();move('error');setError('mic');}}
 }
 async function transcribe(audio:Blob,epoch:number){
  const c=new AbortController();controller.current=c;const timeout=setTimeout(()=>c.abort(),60000);
  try{const response=await fetch('/api/transcribe',{method:'POST',headers:{'Content-Type':audio.type,'x-claim-language':inputLanguage},body:audio,signal:c.signal});const data=await response.json();if(!response.ok||typeof data.transcript!=='string'||!data.transcript.trim()||data.transcript.length>1200)throw new Error('failed');if(epoch===generation.current){if(onText(data.transcript))move('idle');else{move('error');setError('length');}}}
  catch{if(epoch===generation.current){move('error');setError('transcribe');}}finally{clearTimeout(timeout);}
 }
 useImperativeHandle(ref,()=>({start:()=>{if(phaseRef.current==='idle'||phaseRef.current==='error')setRequested(true);},cancel:discard}));
 const recording=phase==='recording',busy=phase==='transcribing',opening=phase==='starting'||(requested&&ready===null);
 const status=ready===false?t[12]:busy?t[9]:opening?openingCopy[language]:recording?t[11]:t[0];
 return <section className={`voice-capture voice-composer ${recording?'is-recording':''} ${busy?'is-transcribing':''}`} aria-label={t[0]} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();}}}>
  <div className="voice-caption"><span role="status">{status}</span>{ready!==false&&<span className="voice-timer" dir="ltr">0:{String(seconds).padStart(2,'0')} / 0:45</span>}</div>
  <div className="voice-bar"><button ref={cancelButton} type="button" className="voice-cancel" aria-label={t[5]} title={t[5]} onClick={cancel}>×</button><div className="voice-wave" aria-hidden="true">{levels.map((height,index)=><i key={index} style={{height:height+'px'}}/>)}</div><button ref={stopButton} type="button" className="voice-finish" disabled={disabled||busy||opening||ready!==true} aria-label={busy?t[9]:opening?openingCopy[language]:recording?t[2]:t[1]} title={recording?t[2]:t[1]} onClick={()=>recording?stop():void start()}>{busy||opening?<span className="voice-spinner"/>:recording?<span className="finish-square"/>:<WorkspaceIcon name="voice"/>}</button></div>
  {error&&<p role="alert">{error==='mic'?t[7]:error==='length'?lengthCopy[language]:t[8]}</p>}
  <details className="voice-help"><summary>{t[0]} · {interfaceText(language,'التفاصيل','Details')}</summary><p>{autoCopy[0]}</p><p>{autoCopy[1]}</p></details>
 </section>;
});

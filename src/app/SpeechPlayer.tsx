'use client';

import {useEffect, useRef, useState} from 'react';
import {matchingVoices, speechChunks} from '@/lib/speech';
import {passageVoiceCopy, type DisplayLanguage} from '@/lib/display-copy';

// Each instance owns its session. Starting another reader cancels the previous one.
let currentOwner: symbol | undefined;
const cancelEvent = 'isnadlens:speech-cancel';
export function SpeechPlayer({text, spokenLanguage, language}: {text: string; spokenLanguage: string; language: DisplayLanguage}) {
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

import {qiblaBearing} from '@/lib/location-tools';
import type {DisplayLanguage} from '@/lib/display-copy';
import {toolLabel} from './tools-copy';
const north={ar:'ش',en:'N',bn:'উ',hi:'उ',ur:'ش',id:'U',es:'N',fr:'N',de:'N'};
export function QiblaCompass({qibla,language}:{qibla:ReturnType<typeof qiblaBearing>|null;language:DisplayLanguage}){
 const ready=qibla?.status==='ready';
 return <div className={`compass-dial ${ready?'is-ready':''}`}>
  <svg role="img" aria-label={toolLabel(language,'اتجاه القبلة من الشمال الحقيقي','Qibla bearing from true north')} viewBox="0 0 240 240">
   <circle className="compass-rim" cx="120" cy="120" r="105"/>
   <circle className="compass-inner" cx="120" cy="120" r="83"/>
   {Array.from({length:36},(_,i)=><path key={i} d={`M120 20V${i%3===0?31:26}`} transform={`rotate(${i*10} 120 120)`} className={i%3===0?'major':'minor'}/>)}
   <text x="120" y="57" textAnchor="middle">{north[language]}</text>
   <path d="M115 120H125 M120 115V125" className="compass-cross"/>
   {ready?<g className="compass-needle" style={{transform:`rotate(${qibla.degrees}deg)`}}><path d="M120 58L132 137L120 129L108 137Z"/><path className="needle-tail" d="M120 181L132 137L120 129L108 137Z"/></g>:<g className="compass-kaaba"><rect x="103" y="101" width="34" height="34" rx="3"/><path d="M103 111H137"/></g>}
   <circle cx="120" cy="120" r="4" className="compass-pin"/>
  </svg>
 </div>;
}

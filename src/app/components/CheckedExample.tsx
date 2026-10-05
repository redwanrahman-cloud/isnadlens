'use client';
import example from '@/lib/checked-example.json';
import {workspaceCopy} from '@/lib/workspace-copy';
import type {DisplayLanguage} from '@/lib/display-copy';
import {WorkspaceIcon} from './WorkspaceIcon';
import {SpeechPlayer} from '../SpeechPlayer';
export function CheckedExample({language,onQuestion}:{language:DisplayLanguage;onQuestion:(text:string)=>void}){
 const ar=language==='ar';const ui=workspaceCopy(language);
 const source=example.evidence;
 const start=source.quotation.indexOf('فَإِذَا');const end=source.quotation.indexOf(' ۚ',start);
 const excerpt=start>=0&&end>start?source.quotation.slice(start,end):source.quotation;
 const translation=example.translation.quotation;
 const translatedStart=translation.indexOf('But once');const translatedEnd=translation.indexOf(', for Allah',translatedStart);
 const translatedExcerpt=translatedStart>=0&&translatedEnd>translatedStart?translation.slice(translatedStart,translatedEnd):translation;
 const summary=ar?example.summary_ar:example.summary_en;
 return <section className="checked-example" aria-label={ar?'مثال مسجل سابقاً':'Previously checked example'}>
  <div className="sample-banner"><span>{ar?'مثال مسجل سابقاً · ليس فحصاً لسؤالك الحالي':'Previously checked example · not a result for your current question'}</span></div>
  <div className="sample-answer"><span className="answer-label">{ui.answer}{!ar&&language!=='en'?' · English':''}</span><h2>{ar?'العزم على القرار، ثم التوكل على الله':'Make a decision. Then put your trust in Allah.'}</h2><p>{summary}</p><SpeechPlayer text={summary} spokenLanguage={ar?'ar':'en'} language={language}/></div>
  <article className="sample-source"><div className="source-label">{ui.original} · {ar?'مقتطف':'Excerpt'}</div><blockquote dir="rtl" lang="ar">{excerpt}</blockquote>{!ar&&<><span className="source-label">{ar?'ترجمة منشورة · مقتطف':'Published translation · excerpt · English'}</span><p className="sample-translation" lang="en">{translatedExcerpt}</p></>}<div className="sample-reference"><bdi>Quran 3:159 · Ali ‘Imran</bdi><a href={source.source_url} target="_blank" rel="noopener noreferrer">{ar?'اقرأ الآية كاملة':'Read full verse'} ↗</a></div></article>
  <section className="evidence-map" aria-label={ui.map}><h3>{ui.map}</h3><ol><li><WorkspaceIcon name="text"/><strong>{ui.question}</strong><small>{ar?'العزم والتوكل':'Decision and trust'}</small></li><li><WorkspaceIcon name="book"/><strong>{ui.sources}</strong><small>Quran 3:159</small></li><li><WorkspaceIcon name="spark"/><strong>{ui.context}</strong><small>{ar?'المشاورة ثم القرار':'Consultation, then decision'}</small></li><li><WorkspaceIcon name="check"/><strong>{ui.conclusion}</strong><small>{ar?'يدعمه النص المستشهد به':'Supported by cited text'}</small></li></ol></section>
  <button type="button" className="example-question" onClick={()=>onQuestion(ar?'هل يربط القرآن العزم على القرار بالتوكل على الله بعده؟':'Does the Quran connect making a firm decision with trusting Allah afterwards?')}>{ar?'استخدم سؤال المثال':'Use this example question'} <WorkspaceIcon name="arrow"/></button>
  <details className="sample-details"><summary>{ar?'النص الكامل وتفاصيل المثال':'Full source and example details'}</summary><p>{ar?'يعرض هذا المثال شرحاً مسجلاً سابقاً واقتباساً حرفياً من الآية. لا تُجرى مكالمة ذكاء اصطناعي عند فتحه.':'This example displays a previously recorded explanation and verbatim excerpts. Opening it makes no AI call.'}</p><p>{example.original_claim}</p><blockquote dir="rtl" lang="ar">{source.quotation}</blockquote><p>{source.attribution} · {source.version} · <a href="https://tanzil.net/docs/Text_License" target="_blank" rel="noopener noreferrer">Tanzil licence ↗</a></p><p lang="en">{translation}</p><p>{example.translation.attribution} · {example.translation.version} · <a href={example.translation.source_url} target="_blank" rel="noopener noreferrer">QuranEnc ↗</a></p><p>{example.record_id} · {example.created_at}</p></details>
 </section>;
}

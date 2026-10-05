'use client';
import {useState} from 'react';
import {downloadReceiptPdf} from '@/lib/download-receipt';
import {checkedExampleReceipt} from '@/lib/checked-example-receipt';
import {ShareCard} from './ShareCard';
import example from '@/lib/checked-example.json';
import {workspaceCopy} from '@/lib/workspace-copy';
import type {DisplayLanguage} from '@/lib/display-copy';
import {WorkspaceIcon} from './WorkspaceIcon';
import {QuranRecitation} from './QuranRecitation';
import {SpeechPlayer} from '../SpeechPlayer';
const exportCopy:Record<DisplayLanguage,{download:string;preparing:string;failed:string}>={
 ar:{download:'تنزيل إيصال PDF',preparing:'جارٍ إعداد PDF…',failed:'تعذر إعداد PDF. حاول مرة أخرى.'},
 en:{download:'Download PDF receipt',preparing:'Preparing PDF…',failed:'Could not prepare the PDF. Please try again.'},
 bn:{download:'PDF রসিদ ডাউনলোড',preparing:'PDF তৈরি হচ্ছে…',failed:'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।'},
 hi:{download:'PDF रसीद डाउनलोड',preparing:'PDF तैयार हो रहा है…',failed:'PDF तैयार नहीं हो सका। फिर कोशिश करें।'},
 ur:{download:'PDF رسید ڈاؤن لوڈ کریں',preparing:'PDF تیار ہو رہا ہے…',failed:'PDF تیار نہیں ہو سکا۔ دوبارہ کوشش کریں۔'},
 id:{download:'Unduh bukti PDF',preparing:'Menyiapkan PDF…',failed:'PDF tidak dapat disiapkan. Coba lagi.'},
 es:{download:'Descargar recibo PDF',preparing:'Preparando PDF…',failed:'No se pudo preparar el PDF. Inténtalo de nuevo.'},
 fr:{download:'Télécharger le reçu PDF',preparing:'Préparation du PDF…',failed:'Le PDF n’a pas pu être préparé. Réessayez.'},
 de:{download:'PDF-Beleg herunterladen',preparing:'PDF wird vorbereitet…',failed:'Das PDF konnte nicht erstellt werden. Bitte erneut versuchen.'},
};
export function CheckedExample({language,onQuestion}:{language:DisplayLanguage;onQuestion:(text:string)=>void}){
 const ar=language==='ar';const ui=workspaceCopy(language);const exports=exportCopy[language];
 const [exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
 async function download(){setExporting(true);setExportError('');try{await downloadReceiptPdf(checkedExampleReceipt(),example.record_id);}catch{setExportError(exports.failed);}finally{setExporting(false);}}
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
  <article className="sample-source"><div className="source-label">{ui.original} · {ar?'مقتطف':'Excerpt'}</div><blockquote dir="rtl" lang="ar">{excerpt}</blockquote><QuranRecitation sourceId={source.source_id} locator={source.locator} language={language}/>{!ar&&<><span className="source-label">{ar?'ترجمة منشورة · مقتطف':'Published translation · excerpt · English'}</span><p className="sample-translation" lang="en">{translatedExcerpt}</p></>}<div className="sample-reference"><bdi>Quran 3:159 · Ali ‘Imran</bdi><a href={source.source_url} target="_blank" rel="noopener noreferrer">{ar?'اقرأ الآية كاملة':'Read full verse'} ↗</a></div></article>
  <section className="evidence-map" aria-label={ui.map}><h3>{ui.map}</h3><ol><li><WorkspaceIcon name="text"/><strong>{ui.question}</strong><small>{ar?'العزم والتوكل':'Decision and trust'}</small></li><li><WorkspaceIcon name="book"/><strong>{ui.sources}</strong><small>Quran 3:159</small></li><li><WorkspaceIcon name="spark"/><strong>{ui.context}</strong><small>{ar?'المشاورة ثم القرار':'Consultation, then decision'}</small></li><li><WorkspaceIcon name="check"/><strong>{ui.conclusion}</strong><small>{ar?'يدعمه النص المستشهد به':'Supported by cited text'}</small></li></ol></section>
  <button type="button" className="example-question" onClick={()=>onQuestion(ar?'هل يربط القرآن العزم على القرار بالتوكل على الله بعده؟':'Does the Quran connect making a firm decision with trusting Allah afterwards?')}>{ar?'استخدم سؤال المثال':'Use this example question'} <WorkspaceIcon name="arrow"/></button>
  <div className="report-actions sample-export-actions"><button type="button" className="receipt-button" disabled={exporting} onClick={()=>void download()}><WorkspaceIcon name="download"/>{exporting?exports.preparing:exports.download}</button><ShareCard record={{record_id:example.record_id,original_claim:example.original_claim,created_at:example.created_at,evidence_items:[source,example.translation]}} summary={summary} verdict={ar?'مثال مسجل سابقاً':'Previously checked example'} language={language}/></div>{exportError&&<p role="alert">{exportError}</p>}
  <details className="sample-details"><summary>{ar?'النص الكامل وتفاصيل المثال':'Full source and example details'}</summary><p>{ar?'يعرض هذا المثال شرحاً مسجلاً سابقاً واقتباساً حرفياً من الآية. لا تُجرى مكالمة ذكاء اصطناعي عند فتحه.':'This example displays a previously recorded explanation and verbatim excerpts. Opening it makes no AI call.'}</p><p>{example.original_claim}</p><blockquote dir="rtl" lang="ar">{source.quotation}</blockquote><p>{source.attribution} · {source.version} · <a href="https://tanzil.net/docs/Text_License" target="_blank" rel="noopener noreferrer">Tanzil licence ↗</a></p><p lang="en">{translation}</p><p>{example.translation.attribution} · {example.translation.version} · <a href={example.translation.source_url} target="_blank" rel="noopener noreferrer">QuranEnc ↗</a></p><p>{example.record_id} · {example.created_at}</p></details>
 </section>;
}

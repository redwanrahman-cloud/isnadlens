'use client';
import {interfaceText} from '@/lib/interface-copy';
import {useState} from 'react';
import {downloadReceiptPdf} from '@/lib/download-receipt';
import {checkedExampleReceipt} from '@/lib/checked-example-receipt';
import {ShareCard} from './ShareCard';
import example from '@/lib/checked-example.json';
import {landingExample as sample,landingExampleCopy} from '@/lib/landing-example';
import {workspaceCopy} from '@/lib/workspace-copy';
import type {DisplayLanguage} from '@/lib/display-copy';
import {WorkspaceIcon} from './WorkspaceIcon';
import {QuranRecitation} from './QuranRecitation';
import {PassageTranslation} from '../PassageTranslation';
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
 const copy=landingExampleCopy(language);const ar=language==='ar';const ui=workspaceCopy(language);const exports=exportCopy[language];
 const [exporting,setExporting]=useState(false),[exportError,setExportError]=useState(false);
 async function download(){setExporting(true);setExportError(false);try{await downloadReceiptPdf(checkedExampleReceipt(language),sample.id);}catch{setExportError(true);}finally{setExporting(false);}}
 const source=example.evidence;
 const start=source.quotation.indexOf('فَإِذَا');const end=source.quotation.indexOf(' ۚ',start);
 const excerpt=start>=0&&end>start?source.quotation.slice(start,end):source.quotation;
 const translation=example.translation.quotation;
 const translatedStart=translation.indexOf('But once');const translatedEnd=translation.indexOf(', for Allah',translatedStart);
 const translatedExcerpt=translatedStart>=0&&translatedEnd>translatedStart?translation.slice(translatedStart,translatedEnd):translation;
 const summary=copy.summary;
 return <section className="checked-example" aria-label={copy.banner}>
  <div className="sample-banner"><span>{copy.banner}</span></div>
  <p className="sample-question" lang={language}>{copy.question}</p><div className="sample-answer" lang={language}><span className="answer-label">{ui.answer}</span><h2>{copy.headline}</h2><p>{summary}</p><SpeechPlayer text={summary} spokenLanguage={language} language={language}/></div>
  <article className="sample-source"><div className="source-label"><span>{ui.original} · {interfaceText(language,'مقتطف','Excerpt')}</span><span className="source-badge">Tanzil · 3:159</span></div><blockquote dir="rtl" lang="ar">{excerpt}</blockquote><QuranRecitation sourceId={source.source_id} locator={source.locator} language={language}/>{language==='en'&&<><span className="source-label">{interfaceText(language,'ترجمة منشورة · مقتطف','Published translation · excerpt · English')}</span><p className="sample-translation" lang="en">{translatedExcerpt}</p></>}{language!=='en'&&<PassageTranslation item={source} language={language}/>}<div className="sample-reference"><bdi>Quran 3:159 · Ali ‘Imran</bdi><a href={source.source_url} target="_blank" rel="noopener noreferrer">{interfaceText(language,'اقرأ الآية كاملة','Read full verse')} ↗</a></div></article>
  <section className="evidence-map" aria-label={ui.map}><h3>{ui.map}</h3><ol><li><WorkspaceIcon name="text"/><strong>{ui.question}</strong><small>{interfaceText(language,'العزم والتوكل','Decision and trust')}</small></li><li><WorkspaceIcon name="book"/><strong>{ui.sources}</strong><small>Quran 3:159</small></li><li><WorkspaceIcon name="spark"/><strong>{ui.context}</strong><small>{interfaceText(language,'المشاورة ثم القرار','Consultation, then decision')}</small></li><li><WorkspaceIcon name="check"/><strong>{ui.conclusion}</strong><small>{copy.headline}</small></li></ol></section>
  <button type="button" className="example-question" onClick={()=>onQuestion(copy.question)}>{copy.use} <WorkspaceIcon name="arrow"/></button>
  <div className="report-actions sample-export-actions"><button type="button" className="receipt-button" disabled={exporting} onClick={()=>void download()}><WorkspaceIcon name="download"/>{exporting?exports.preparing:exports.download}</button><ShareCard record={{record_id:sample.id,original_claim:copy.question,created_at:example.created_at,evidence_items:[source,example.translation]}} summary={summary} verdict={copy.banner} language={language}/></div>{exportError&&<p role="alert">{exports.failed}</p>}
  <details className="sample-details"><summary>{interfaceText(language,'النص الكامل وتفاصيل المثال','Full source and example details')}</summary><p>{interfaceText(language,'يعرض هذا المثال شرحاً توضيحياً واقتباساً حرفياً من الآية. لا تُجرى مكالمة ذكاء اصطناعي عند فتحه.','This example displays a curated explanation and verbatim excerpts, using evidence retained from an earlier assessment. Opening it makes no AI call.')}</p><p>{copy.question}</p><blockquote dir="rtl" lang="ar">{source.quotation}</blockquote><p>{source.attribution} · {source.version} · <a href="https://tanzil.net/docs/Text_License" target="_blank" rel="noopener noreferrer">Tanzil licence ↗</a></p><p lang="en">{translation}</p><p>{example.translation.attribution} · {example.translation.version} · <a href={example.translation.source_url} target="_blank" rel="noopener noreferrer">QuranEnc ↗</a></p><p>{example.record_id} · {example.created_at}</p></details>
 </section>;
}

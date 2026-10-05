'use client';

import {useRef, useState} from 'react';
import {landingExampleCopy} from '@/lib/landing-example';
import example from '@/lib/checked-example.json';
import styles from './preview.module.css';

type IconName = 'lens'|'arrow'|'book'|'save'|'mic'|'image'|'write'|'globe'|'check'|'compass'|'grid'|'external'|'back'|'close'|'info'|'copy'|'chevron';
function Icon({name, size=20}:{name:IconName;size?:number}) {
 const paths:Record<IconName,string>={lens:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6 M10 6v8 M6 10h8',arrow:'M4 12h16 M14 6l6 6-6 6',book:'M12 5v16 M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1z',save:'M6 3h12v18l-6-4-6 4z',mic:'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0z M5 10v1a7 7 0 0 0 14 0v-1 M12 18v4 M8 22h8',image:'M3 4h18v16H3z M3 17l6-6 4 4 3-3 5 5 M16 8h.01',write:'M4 17l-1 4 4-1L20 7l-3-3z M14 7l3 3',globe:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M2 12h20 M12 2c-5 5-5 15 0 20 5-5 5-15 0-20',check:'M5 12l4 4L19 6',compass:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M16 8l-3 5-5 3 3-5z',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',external:'M14 3h7v7 M21 3L10 14 M10 3H3v18h18v-7',back:'M20 12H4 M10 6l-6 6 6 6',close:'M6 6l12 12 M6 18L18 6',info:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 11v6 M12 7h.01',copy:'M9 9h12v12H9z M15 5V3H3v12h2',chevron:'M8 10l4 4 4-4'};
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
function Mark(){return <svg width="38" height="38" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 3 45 24 24 45 3 24Z" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10h28v28H10z" stroke="currentColor" strokeWidth="1.3"/><circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="1.3"/><circle cx="24" cy="24" r="2.5" fill="currentColor"/></svg>}

export default function DesignPreview(){
 const [ar,setAr]=useState(false), [view,setView]=useState<'home'|'result'|'saved'>('home');
 const [mode,setMode]=useState<'write'|'voice'|'image'>('write'), [question,setQuestion]=useState('');
 const [tab,setTab]=useState<'answer'|'sources'>('answer'), [saved,setSaved]=useState(false);
 const [notice,setNotice]=useState(''), [companion,setCompanion]=useState<'pilgrimage'|'daily'|null>(null);
 const inputRef=useRef<HTMLTextAreaElement>(null), resultRef=useRef<HTMLHeadingElement>(null);
 const copy=landingExampleCopy(ar?'ar':'en');
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const source=example.evidence;
 const start=source.quotation.indexOf('فَإِذَا'), end=source.quotation.indexOf(' ۚ',start);
 const excerpt=source.quotation.slice(start,end);
 const translationStart=example.translation.quotation.indexOf('But once');
 const translationEnd=example.translation.quotation.indexOf(', for Allah',translationStart);
 const translated=example.translation.quotation.slice(translationStart,translationEnd);
 function showExample(){setView('result');setTab('answer');setNotice('');window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>resultRef.current?.focus(),50);}
 function home(){setView('home');setCompanion(null);setNotice('');}
 function useQuestion(){setMode('write');setQuestion(copy.question);setTimeout(()=>inputRef.current?.focus(),0);}
 async function copyReference(){try{await navigator.clipboard.writeText(`${copy.question}\n\n${copy.summary}\n\nQuran 3:159 — ${source.source_url}\n${t('Illustrative example; no new verification run.','مثال توضيحي؛ لم يُجرَ تحقق جديد.')}`);setNotice(t('Example and source link copied.','تم نسخ المثال ورابط المصدر.'));}catch{setNotice(t('Copy is unavailable in this browser. The source link is below.','تعذر النسخ في هذا المتصفح. رابط المصدر أدناه.'));}}

 return <div className={styles.app} dir={ar?'rtl':'ltr'} lang={ar?'ar':'en'}>
  <a className={styles.skip} href="#design-main">{t('Skip to content','انتقل إلى المحتوى')}</a>
  <aside className={styles.sidebar}>
   <button className={styles.brand} onClick={home} aria-label={t('IsnadLens home','عدسة الإسناد الرئيسية')}><span className={styles.mark}><Mark/></span><span>IsnadLens<small>عدسة الإسناد</small></span></button>
   <div className={styles.navLabel}>{t('YOUR WORKSPACE','مساحة العمل')}</div>
   <nav aria-label={t('Main navigation','التنقل الرئيسي')} className={styles.nav}>
    <button className={view!=='saved'?styles.active:''} aria-current={view!=='saved'?'page':undefined} onClick={home}><Icon name="lens"/>{t('Verify a question','تحقق من سؤال')}<span className={styles.navDot}/></button>
    <button className={view==='saved'?styles.active:''} aria-current={view==='saved'?'page':undefined} onClick={()=>{setView('saved');setCompanion(null);}}><Icon name="save"/>{t('Saved answers','الإجابات المحفوظة')}{saved&&<span className={styles.count}>1</span>}</button>
   </nav>
   <div className={styles.navLabel}>{t('EXPLORE MORE','استكشف المزيد')}</div>
   <nav aria-label={t('Companion tools','الأدوات المساعدة')} className={styles.nav}>
    <button onClick={()=>{setCompanion('pilgrimage');setView('home');}}><Icon name="compass"/>{t('Hajj & Umrah','الحج والعمرة')}</button>
    <button onClick={()=>{setCompanion('daily');setView('home');}}><Icon name="grid"/>{t('Daily essentials','أدواتك اليومية')}</button>
   </nav>
   <div className={styles.sidebarBottom}><div className={styles.sidePattern}><Mark/></div><p>{t('Understanding begins','الفهم يبدأ')}<br/>{t('with the source.','من المصدر.')}</p><span>{t('Quran · Hadith · Context','قرآن · حديث · سياق')}</span><a href="/method" target="_blank" rel="noopener noreferrer"><Icon name="info" size={17}/>{t('Our approach','منهجنا')}<Icon name="external" size={14}/></a></div>
  </aside>

  <div className={styles.workspace}>
   <header className={styles.topbar}>
    <div className={styles.breadcrumb}><span>{t('Workspace','مساحة العمل')}</span><span>/</span><strong>{view==='saved'?t('Saved answers','الإجابات المحفوظة'):t('Verification','التحقق')}</strong></div>
    <div className={styles.headerRight}><span className={styles.prototype}>{t('DESIGN PREVIEW','معاينة التصميم')}</span><div className={styles.language} aria-label={t('Display language','لغة العرض')}><button aria-pressed={!ar} onClick={()=>setAr(false)}>EN</button><button aria-pressed={ar} onClick={()=>setAr(true)}>عربي</button></div></div>
   </header>

   <main id="design-main" className={styles.main}>
   {view==='home'&&<>
    <section className={styles.hero}>
     <div><div className={styles.eyebrow}><span/>{t('A LITTLE MORE CLARITY. A LITTLE LESS DOUBT.','وضوح أكثر. تساؤلات أقل.')}</div><h1>{t('Every question deserves','لكل سؤال،')}<br/><em>{t('a clear source.','مصدرٌ واضح.')}</em></h1><p>{t('Ask in your own words. Understand the answer.','اسأل بلغتك. افهم الإجابة.')}<br className={styles.desktopBreak}/>{t(' Explore the Quran and Hadith behind it.',' واستكشف أدلتها من القرآن والحديث.')}</p></div>
     <div className={styles.sourceArt} aria-hidden="true"><div className={styles.orbit}/><div className={styles.orbitInner}/><div className={styles.artCore}><Mark/></div><span className={styles.artTop}><Icon name="book" size={15}/>{t('Original sources','النصوص الأصلية')}</span><span className={styles.artBottom}><Icon name="check" size={15}/>{t('A clearer understanding','فهم أوضح')}</span><i className={styles.artDot}/></div>
    </section>

    <section className={styles.composer} aria-label={t('Your question','سؤالك')}>
     <div className={styles.composerTop}><div className={styles.inputTabs} role="group" aria-label={t('Input method','طريقة الإدخال')}>
      {(['write','voice','image'] as const).map((item)=><button key={item} aria-pressed={mode===item} onClick={()=>setMode(item)}><Icon name={item==='voice'?'mic':item}/>{item==='write'?t('Write','اكتب'):item==='voice'?t('Speak','تحدث'):t('Upload','أرفق صورة')}</button>)}
     </div><label className={styles.sourceSelect}><Icon name="book" size={16}/><select aria-label={t('Source collection','مجموعة المصادر')} defaultValue="both"><option value="both">{t('Quran + Hadith','القرآن والحديث')}</option><option value="quran">{t('Quran','القرآن')}</option><option value="hadith">{t('Hadith','الحديث')}</option></select><Icon name="chevron" size={14}/></label></div>
     {mode==='write'?<textarea ref={inputRef} aria-label={t('Type your question','اكتب سؤالك')} placeholder={t('What would you like to understand?','ما الذي تود فهمه؟')} value={question} maxLength={2000} onChange={e=>setQuestion(e.target.value)}/>:<div className={styles.mediaPreview}><span><Icon name={mode==='voice'?'mic':'image'} size={28}/></span><div><h2>{mode==='voice'?t('Your voice. Your question.','بصوتك. وبكلماتك.'):t('A quote worth checking?','اقتباس تود التحقق منه؟')}</h2><p>{mode==='voice'?t('Recording starts here in the full app. You review the text before checking.','يبدأ التسجيل هنا في التطبيق الكامل. راجع النص قبل التحقق.'):t('Add a screenshot or photo, then review the extracted question.','أضف لقطة شاشة أو صورة، ثم راجع السؤال المستخرج.')}</p><small>{t('Visual preview only · No recording or upload','معاينة فقط · لا تسجيل ولا رفع ملفات')}</small></div></div>}
     <div className={styles.composerBottom}><div className={styles.detect}><Icon name="globe" size={17}/>{t('Your language, automatically','لغتك، تلقائيًا')}<span>{question.length}/2000</span></div><button className={styles.primary} onClick={showExample}>{t('Preview an answer','عاين إجابة')}<Icon name="arrow" size={19}/></button></div>
    </section>
    <div className={styles.previewNote}><Icon name="info" size={14}/>{t('Interactive concept · The answer preview uses one curated example. No live verification.','تصور تفاعلي · تعرض المعاينة مثالًا توضيحيًا واحدًا، دون تحقق مباشر.')}</div>
    <div className={styles.tryRow}><span>{t('A place to start','ابدأ بمثال')}</span><button onClick={useQuestion}>{copy.question}<Icon name="arrow" size={16}/></button></div>

    <section className={styles.trustRow} aria-label={t('How it works','كيف تعمل')}>
     <div><span>01</span><div><h2>{t('Ask naturally','اسأل ببساطة')}</h2><p>{t('A question, a quote, or something you heard.','سؤال، اقتباس، أو معلومة سمعتها.')}</p></div></div>
     <div><span>02</span><div><h2>{t('See the reasoning','افهم التفسير')}</h2><p>{t('A clear explanation, with its limits.','شرح واضح، مع بيان حدوده.')}</p></div></div>
     <div><span>03</span><div><h2>{t('Go to the source','عُد إلى المصدر')}</h2><p>{t('Original text. Context. References.','النص الأصلي. السياق. المراجع.')}</p></div></div>
    </section>
    <div className={styles.companionHeading}><h2>{t('Alongside your questions','إلى جانب أسئلتك')}</h2><span>{t('Thoughtful tools for everyday practice','أدوات تعينك في يومك')}</span></div>
    <div className={styles.companionCards}><button onClick={()=>setCompanion(companion==='pilgrimage'?null:'pilgrimage')} aria-expanded={companion==='pilgrimage'}><span className={styles.companionIcon}><Icon name="compass" size={24}/></span><div><strong>{t('Your pilgrimage companion','رفيق رحلتك')}</strong><p>{t('Hajj & Umrah guides, questions, and round counter','دليل الحج والعمرة، أسئلة، وعدّاد الأشواط')}</p></div><Icon name="arrow"/></button><button onClick={()=>setCompanion(companion==='daily'?null:'daily')} aria-expanded={companion==='daily'}><span className={styles.companionIcon}><Icon name="grid" size={23}/></span><div><strong>{t('Your daily essentials','أساسيات يومك')}</strong><p>{t('Prayer times, Qibla, and the Hijri calendar','مواقيت الصلاة، القبلة، والتقويم الهجري')}</p></div><Icon name="arrow"/></button></div>
    {companion&&<section className={styles.companionDetail} aria-live="polite"><div><h3>{companion==='pilgrimage'?t('One journey. Three clear paths.','رحلة واحدة. ثلاثة مسارات واضحة.'):t('Your place. Your daily rhythm.','موقعك. وإيقاع يومك.')}</h3><p>{companion==='pilgrimage'?t('Ask a question → Learn the steps → Count your rounds','اسأل سؤالًا ← تعرّف على الخطوات ← عُدّ أشواطك'):t('Choose a location → See prayer times → Find Qibla and dates','اختر موقعًا ← اعرف أوقات الصلاة ← اعرف القبلة والتاريخ')}</p><small>{t('Navigation concept. Existing companion tools will be connected during the full redesign.','تصور للتنقل. ستُربط الأدوات الحالية خلال تنفيذ التصميم الكامل.')}</small></div><button onClick={()=>setCompanion(null)} aria-label={t('Close companion preview','إغلاق معاينة الأدوات')}><Icon name="close"/></button></section>}
   </>}

   {view==='result'&&<>
    <div className={styles.resultTop}><button className={styles.textButton} onClick={home}><Icon name="back" size={17}/>{t('Back to your question','العودة إلى سؤالك')}</button><span className={styles.sampleLabel}>{t('ILLUSTRATIVE EXAMPLE','مثال توضيحي')}</span></div>
    <section className={styles.resultIntro}><div className={styles.eyebrow}>{t('FROM QUESTION TO UNDERSTANDING','من السؤال إلى الفهم')}</div><h1 ref={resultRef} tabIndex={-1}>{copy.question}</h1><p>{t('Curated explanation · Quran 3:159 · No new verification run','شرح توضيحي · القرآن 3:159 · لم يُجرَ تحقق جديد')}</p></section>
    <div className={styles.resultGrid}>
     <div className={styles.resultCard}>
      <div className={styles.resultTabs} role="group" aria-label={t('Result view','عرض النتيجة')}><button aria-pressed={tab==='answer'} onClick={()=>setTab('answer')}>{t('The explanation','الشرح')}</button><button aria-pressed={tab==='sources'} onClick={()=>setTab('sources')}>{t('Original evidence','الأدلة الأصلية')}<span>1</span></button></div>
      {tab==='answer'?<div className={styles.answerBody}><div className={styles.answerEyebrow}><span><Icon name="book" size={15}/></span>{t('WHAT THIS PASSAGE TELLS US','ما يبينه هذا النص')}</div><h2>{copy.headline}</h2><p className={styles.answerSummary}>{copy.summary}</p><div className={styles.sourceExcerpt}><div><span>01</span><strong>{t('Quran · Ali ‘Imran','القرآن · آل عمران')}</strong><bdi>3:159</bdi></div><blockquote lang="ar" dir="rtl">{excerpt}</blockquote>{!ar&&<p className={styles.translation}>“{translated}”</p>}<div className={styles.excerptFoot}><small>{t('Excerpt · Tanzil Arabic / QuranEnc English','مقتطف · النص العربي من تنزيل')}</small><button onClick={()=>setTab('sources')}>{t('Read in context','اقرأ في السياق')}<Icon name="arrow" size={15}/></button></div></div><div className={styles.limit}><Icon name="info" size={18}/><p>{t('An explanation of the cited passage, not a personal fatwa. Your circumstances may need a qualified scholar.','شرح للنص المستشهد به، وليس فتوى شخصية. قد تحتاج ظروفك الخاصة إلى سؤال عالم مؤهل.')}</p></div></div>:<div className={styles.sourcesBody}><div className={styles.sourceTitle}><span className={styles.sourceNumber}>01</span><div><h2>{t('Surah Ali ‘Imran','سورة آل عمران')}</h2><p>{t('Quran 3:159 · Tanzil Uthmani · v1.1','القرآن 3:159 · تنزيل العثماني · 1.1')}</p></div><span className={styles.originalTag}>{t('ORIGINAL TEXT','النص الأصلي')}</span></div><blockquote lang="ar" dir="rtl">{source.quotation}</blockquote><div className={styles.sourceAttribution}><span>{source.attribution} · {source.version}</span><a href="https://tanzil.net/docs/Text_License" target="_blank" rel="noopener noreferrer">{t('Text licence','ترخيص النص')} ↗</a></div><h3>{t('Published English translation','ترجمة إنجليزية منشورة')}</h3><p lang="en" dir="ltr">{example.translation.quotation}</p><small>{example.translation.attribution}</small><a className={styles.sourceLink} href={example.translation.source_url} target="_blank" rel="noopener noreferrer">{t('Translation on QuranEnc','الترجمة على موسوعة القرآن')}<Icon name="external" size={15}/></a><div className={styles.contextNote}><strong>{t('Why context matters','لماذا يهم السياق')}</strong><p>{t('The passage mentions consultation, then making a decision, then reliance on Allah. Read the whole verse alongside the excerpt.','تذكر الآية المشاورة، ثم العزم، ثم التوكل على الله. اقرأ الآية كاملة إلى جانب المقتطف.')}</p></div><a className={styles.sourceLink} href={source.source_url} target="_blank" rel="noopener noreferrer">{t('Open the original verse','افتح الآية الأصلية')}<Icon name="external" size={16}/></a></div>}
      <div className={styles.resultActions}><button aria-pressed={saved} onClick={()=>setSaved(!saved)}><Icon name={saved?'check':'save'} size={17}/>{saved?t('Saved for this visit','محفوظ لهذه الزيارة'):t('Save example','احفظ المثال')}</button><button onClick={()=>void copyReference()}><Icon name="copy" size={17}/>{t('Copy with source','انسخ مع المصدر')}</button></div>
     </div>
     <aside className={styles.evidenceRail}><div className={styles.evidenceRailTitle}><Icon name="lens" size={20}/><h2>{t('Follow the evidence','تتبّع الدليل')}</h2></div><ol><li><span>1</span><div><strong>{t('The question','السؤال')}</strong><p>{t('Trust and practical effort','التوكل والأخذ بالأسباب')}</p></div></li><li><span>2</span><div><strong>{t('The source','المصدر')}</strong><button onClick={()=>setTab('sources')}>{t('Quran 3:159','القرآن 3:159')}<Icon name="arrow" size={14}/></button></div></li><li><span>3</span><div><strong>{t('The context','السياق')}</strong><p>{t('Consultation → decision → trust','المشاورة ← العزم ← التوكل')}</p></div></li></ol><div className={styles.railNote}><Icon name="book" size={20}/><p>{t('The explanation and the original text stay separate. You can always inspect the source.','يبقى الشرح منفصلًا عن النص الأصلي. ويمكنك دائمًا الرجوع إلى المصدر.')}</p></div><button className={styles.newQuestion} onClick={home}>{t('Explore another question','استكشف سؤالًا آخر')}<Icon name="arrow" size={16}/></button></aside>
    </div>
    {notice&&<p className={styles.notice} role="status">{notice}</p>}
   </>}

   {view==='saved'&&<section className={styles.savedPage}><div className={styles.eyebrow}>{t('YOUR READING, KEPT CLOSE','معارفك، في متناولك')}</div><h1>{t('Worth coming back to.','تستحق العودة إليها.')}</h1><p>{t('This prototype keeps examples for this visit only.','تحتفظ هذه المعاينة بالأمثلة خلال الزيارة الحالية فقط.')}</p>{saved?<button className={styles.savedCard} onClick={showExample}><span className={styles.sourceNumber}><Icon name="save"/></span><div><small>{t('ILLUSTRATIVE EXAMPLE · QURAN 3:159','مثال توضيحي · القرآن 3:159')}</small><h2>{copy.question}</h2><p>{t('Open explanation and original evidence','افتح الشرح والأدلة الأصلية')}</p></div><Icon name="arrow"/></button>:<div className={styles.savedEmpty}><Icon name="save" size={36}/><h2>{t('A space for what you learn.','مساحة لما تتعلمه.')}</h2><p>{t('Open the example and save it to try this view.','افتح المثال واحفظه لتجربة هذه الصفحة.')}</p><button className={styles.primary} onClick={showExample}>{t('Explore the example','استكشف المثال')}<Icon name="arrow" size={18}/></button></div>}</section>}
   <footer className={styles.footer}><span><Mark/>IsnadLens</span><p>{t('Evidence to explore. Understanding to build.','أدلة تستكشفها. وفهم تبنيه.')}</p><span>{t('A guide to sources. Not a personal fatwa.','دليل إلى المصادر، وليس فتوى شخصية.')}</span></footer>
   </main>
  </div>
 </div>;
}

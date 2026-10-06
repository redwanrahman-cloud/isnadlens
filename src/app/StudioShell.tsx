'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {displayLanguageMetadata,type DisplayLanguage} from '@/lib/display-copy';
import {workspaceCopy} from '@/lib/workspace-copy';
import {studioCopy} from '@/lib/studio-copy';
import {BrandMark,WorkspaceIcon} from './components/WorkspaceIcon';
import {MotionControl} from './components/MotionControl';
import {LanguageSelector} from './components/LanguageSelector';
import styles from './studio.module.css';

export function StudioShell({language,onLanguage,service='main',saved=false,onHome,onSaved,children}:{language:DisplayLanguage;onLanguage:(language:DisplayLanguage)=>void;service?:'main'|'pilgrimage'|'daily';saved?:boolean;onHome?:()=>void;onSaved?:()=>void;children:ReactNode}){
 const ui=workspaceCopy(language),t=studioCopy(language);
 const [sidebarOpen,setSidebarOpen]=useState(false);
 const menuButton=useRef<HTMLButtonElement>(null);
 const menuLabels=({ar:['فتح القائمة','إغلاق القائمة'],en:['Open navigation','Close navigation'],bn:['মেনু খুলুন','মেনু বন্ধ করুন'],hi:['मेनू खोलें','मेनू बंद करें'],ur:['مینو کھولیں','مینو بند کریں'],id:['Buka navigasi','Tutup navigasi'],es:['Abrir navegación','Cerrar navegación'],fr:['Ouvrir la navigation','Fermer la navigation'],de:['Navigation öffnen','Navigation schließen']})[language];
 useEffect(()=>{try{setSidebarOpen(localStorage.getItem('isnadlens:sidebar')==='open');}catch{}},[]);
 function setMenu(open:boolean){setSidebarOpen(open);try{localStorage.setItem('isnadlens:sidebar',open?'open':'closed');}catch{}}
 useEffect(()=>{if(!sidebarOpen)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenu(false);menuButton.current?.focus();}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[sidebarOpen]);
 return <div className={`${styles.app} studio studio-${service}`} data-sidebar={sidebarOpen?"open":"closed"} dir={displayLanguageMetadata[language].direction} lang={language}>
  <a className={styles.skip} href="#studio-main">{ui.ask}</a>
  <aside id="studio-navigation" onClick={event=>{if((event.target as Element).closest('a')&&window.matchMedia('(max-width:700px)').matches)setMenu(false);}} hidden={!sidebarOpen} className={`${styles.sidebar} studio-sidebar`}>
   <a className={`${styles.brand} studio-brand`} href="/" aria-label="IsnadLens"><span className={styles.mark}><BrandMark/></span><span>IsnadLens<small>عدسة الإسناد</small></span></a>
   <div className={`${styles.navLabel} studio-nav-label`}>{t.workspace}</div>
   <nav className={styles.nav} aria-label={t.workspace}>
    <a className={service==='main'&&!saved?styles.active:''} href="/" onClick={onHome?event=>{event.preventDefault();onHome();}:undefined} aria-current={service==='main'&&!saved?'page':undefined} aria-label={ui.main} title={ui.main}><WorkspaceIcon name="spark"/><span>{ui.main}</span></a>
    <a className={saved?styles.active:''} href="/#recent-checks" onClick={onSaved?event=>{event.preventDefault();onSaved();}:undefined} aria-current={saved?'page':undefined} aria-label={ui.saved} title={ui.saved}><WorkspaceIcon name="save"/><span>{ui.saved}</span></a>
   </nav>
   <div className={`${styles.navLabel} studio-nav-label`}>{t.explore}</div>
   <nav className={styles.nav} aria-label={t.tools}>
    <a href="/pilgrimage" className={service==='pilgrimage'?styles.active:''} aria-current={service==='pilgrimage'?'page':undefined} aria-label={ui.companion} title={ui.companion}><WorkspaceIcon name="compass"/><span>{ui.companion}</span></a>
    <a href="/tools" className={service==='daily'?styles.active:''} aria-current={service==='daily'?'page':undefined} aria-label={t.daily} title={t.daily}><WorkspaceIcon name="calendar"/><span>{t.daily}</span></a>
   </nav>
   <div className={`${styles.sidebarBottom} studio-sidebar-bottom`}><div className={styles.sidePattern}><BrandMark/></div><p>{t.motto}</p><a href="/method">{t.method}<WorkspaceIcon name="arrow"/></a><a href="/evaluation/latest">{({ar:'نتائج الاختبار',en:'Test results',bn:'পরীক্ষার ফলাফল',hi:'परीक्षण परिणाम',ur:'ٹیسٹ کے نتائج',id:'Hasil pengujian',es:'Resultados',fr:'Résultats',de:'Testergebnisse'})[language]}</a></div>
  </aside>
  <div className={`${styles.workspace} studio-workspace`}>
   <header className={`${styles.topbar} studio-topbar`}><div className="studio-navigation-heading"><button ref={menuButton} type="button" className="studio-menu-toggle" aria-expanded={sidebarOpen} aria-controls="studio-navigation" aria-label={menuLabels[sidebarOpen?1:0]} title={menuLabels[sidebarOpen?1:0]} onClick={()=>setMenu(!sidebarOpen)}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={sidebarOpen?"M6 6L18 18M18 6L6 18":"M4 6H20M4 12H20M4 18H20"}/></svg></button><div className={styles.breadcrumb}><a className="studio-compact-brand" href="/" aria-label="IsnadLens"><BrandMark/><span>IsnadLens</span></a><span>/</span><strong>{saved?ui.saved:service==='main'?ui.main:service==='pilgrimage'?ui.companion:t.daily}</strong></div></div><div className="studio-header-controls"><MotionControl language={language}/><LanguageSelector language={language} onLanguage={onLanguage}/></div></header>
   <div className="studio-content">{children}</div>
  </div>
 </div>;
}
export function StudioHero({language,companion=false}:{language:DisplayLanguage;companion?:boolean}){
 const t=studioCopy(language),ui=workspaceCopy(language);
 return <section className={`${styles.hero} studio-hero`}><div><div className={styles.eyebrow}><span/>{companion?t.tools:t.eyebrow}</div><h1>{companion?ui.companion:<>{t.headline}{' '}<br/><em>{t.headlineEnd}</em></>}</h1><p>{companion?t.journeyNote:ui.hint}</p></div><div className={styles.sourceArt} aria-hidden="true"><div className={styles.orbit}/><div className={styles.orbitInner}/><div className={styles.artCore}><BrandMark/></div><span className={styles.artTop}><WorkspaceIcon name="book"/>{t.original}</span><span className={styles.artBottom}><WorkspaceIcon name="check"/>{t.traceable}</span><i className={styles.artDot}/></div></section>;
}
export function StudioCompanions({language}:{language:DisplayLanguage}){
 const t=studioCopy(language),ui=workspaceCopy(language);
 return <><div className={`${styles.trustRow} studio-trust-row`}>{[[t.original,t.originalNote],[t.traceable,t.traceableNote],[t.limits,t.limitsNote]].map(([title,note],i)=><div key={title}><span>0{i+1}</span><div><h2>{title}</h2><p>{note}</p></div></div>)}</div><div className={styles.companionHeading}><h2>{t.tools}</h2></div><div className={`${styles.companionCards} studio-companions`}><a href="/pilgrimage"><span className={styles.companionIcon}><WorkspaceIcon name="compass"/></span><div><strong>{ui.companion}</strong><p>{t.journeyNote}</p></div><WorkspaceIcon name="arrow"/></a><a href="/tools"><span className={styles.companionIcon}><WorkspaceIcon name="calendar"/></span><div><strong>{t.daily}</strong><p>{t.dailyNote}</p></div><WorkspaceIcon name="arrow"/></a></div></>;
}

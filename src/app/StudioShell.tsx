'use client';
import type {ReactNode} from 'react';
import {displayLanguages,displayLanguageMetadata,displayCopy,type DisplayLanguage} from '@/lib/display-copy';
import {workspaceCopy} from '@/lib/workspace-copy';
import {studioCopy} from '@/lib/studio-copy';
import {BrandMark,WorkspaceIcon} from './components/WorkspaceIcon';
import styles from './studio.module.css';

export function StudioShell({language,onLanguage,service='main',saved=false,onHome,onSaved,children}:{language:DisplayLanguage;onLanguage:(language:DisplayLanguage)=>void;service?:'main'|'pilgrimage'|'daily';saved?:boolean;onHome?:()=>void;onSaved?:()=>void;children:ReactNode}){
 const ui=workspaceCopy(language),t=studioCopy(language);
 return <div className={`${styles.app} studio studio-${service}`} dir={displayLanguageMetadata[language].direction} lang={language}>
  <a className={styles.skip} href="#studio-main">{ui.ask}</a>
  <aside className={styles.sidebar}>
   <a className={styles.brand} href="/" aria-label="IsnadLens"><span className={styles.mark}><BrandMark/></span><span>IsnadLens<small>عدسة الإسناد</small></span></a>
   <div className={styles.navLabel}>{t.workspace}</div>
   <nav className={styles.nav} aria-label={t.workspace}>
    <a className={service==='main'&&!saved?styles.active:''} href="/" onClick={onHome?event=>{event.preventDefault();onHome();}:undefined} aria-current={service==='main'&&!saved?'page':undefined} aria-label={ui.main} title={ui.main}><WorkspaceIcon name="spark"/><span>{ui.main}</span></a>
    <a className={saved?styles.active:''} href="/#recent-checks" onClick={onSaved?event=>{event.preventDefault();onSaved();}:undefined} aria-current={saved?'page':undefined} aria-label={ui.saved} title={ui.saved}><WorkspaceIcon name="save"/><span>{ui.saved}</span></a>
   </nav>
   <div className={styles.navLabel}>{t.explore}</div>
   <nav className={styles.nav} aria-label={t.tools}>
    <a href="/pilgrimage" className={service==='pilgrimage'?styles.active:''} aria-current={service==='pilgrimage'?'page':undefined} aria-label={ui.companion} title={ui.companion}><WorkspaceIcon name="compass"/><span>{ui.companion}</span></a>
    <a href="/tools" className={service==='daily'?styles.active:''} aria-current={service==='daily'?'page':undefined} aria-label={t.daily} title={t.daily}><WorkspaceIcon name="calendar"/><span>{t.daily}</span></a>
   </nav>
   <div className={styles.sidebarBottom}><div className={styles.sidePattern}><BrandMark/></div><p>{t.motto}</p><a href="/method">{t.method}<WorkspaceIcon name="arrow"/></a><a href="/evaluation/latest">{({ar:'نتائج الاختبار',en:'Test results',bn:'পরীক্ষার ফলাফল',hi:'परीक्षण परिणाम',ur:'ٹیسٹ کے نتائج',id:'Hasil pengujian',es:'Resultados',fr:'Résultats',de:'Testergebnisse'})[language]}</a></div>
  </aside>
  <div className={styles.workspace}>
   <header className={styles.topbar}><div className={styles.breadcrumb}><span>{t.workspace}</span><span>/</span><strong>{saved?ui.saved:service==='main'?ui.main:service==='pilgrimage'?ui.companion:t.daily}</strong></div><label className="studio-language"><span className="sr-only">{displayCopy[language].langs}</span><select id="display-language" value={language} onChange={event=>onLanguage(event.target.value as DisplayLanguage)}>{displayLanguages.map(code=><option key={code} value={code}>{displayLanguageMetadata[code].nativeName}</option>)}</select></label></header>
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
 return <><div className={styles.trustRow}>{[[t.original,t.originalNote],[t.traceable,t.traceableNote],[t.limits,t.limitsNote]].map(([title,note],i)=><div key={title}><span>0{i+1}</span><div><h2>{title}</h2><p>{note}</p></div></div>)}</div><div className={styles.companionHeading}><h2>{t.tools}</h2></div><div className={`${styles.companionCards} studio-companions`}><a href="/pilgrimage"><span className={styles.companionIcon}><WorkspaceIcon name="compass"/></span><div><strong>{ui.companion}</strong><p>{t.journeyNote}</p></div><WorkspaceIcon name="arrow"/></a><a href="/tools"><span className={styles.companionIcon}><WorkspaceIcon name="calendar"/></span><div><strong>{t.daily}</strong><p>{t.dailyNote}</p></div><WorkspaceIcon name="arrow"/></a></div></>;
}

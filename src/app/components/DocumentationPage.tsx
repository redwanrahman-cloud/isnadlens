'use client';
import type {ReactNode} from 'react';
import {useDisplayLanguage} from '@/lib/use-display-language';
import {BrandMark} from './WorkspaceIcon';
import './documentation.css';
export function DocumentationPage({arabic,english}:{arabic:ReactNode;english:ReactNode}){
 const [language,select]=useDisplayLanguage();
 const ar=language==='ar';
 return <div className="site-shell documentation-page" lang={ar?'ar':'en'} dir={ar?'rtl':'ltr'}>
  <header className="topbar"><a className="brand" href="/"><BrandMark/><strong>IsnadLens</strong></a><div className="documentation-actions"><a href="/">{ar?'مساحة التحقق':'Verification workspace'} ↗</a><div className="language-toggle" aria-label={ar?'لغة التوثيق':'Documentation language'}><button type="button" aria-pressed={ar} onClick={()=>select('ar')}>العربية</button><button type="button" aria-pressed={!ar} onClick={()=>select('en')}>EN</button></div></div></header>
  <nav className="documentation-nav" aria-label={ar?'توثيق المشروع':'Project documentation'}><a href="/method">{ar?'منهج التحقق':'How it works'}</a><a href="/evaluation/latest">{ar?'نتائج الاختبار':'Test results'}</a><a href="/sources">{ar?'المصادر وحقوق الاستخدام':'Sources & attribution'}</a></nav>
  <main className="method-content">{ar?arabic:english}</main>
  <footer><span>IsnadLens · عدسة الإسناد</span><p>{ar?'أداة لتتبّع الأدلة، وليست فتوى أو تصحيحًا مستقلًا للحديث.':'A tool for tracing evidence, not a fatwa or independent hadith authentication.'}</p></footer>
 </div>;
}

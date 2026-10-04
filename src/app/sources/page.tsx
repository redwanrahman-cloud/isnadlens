import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export default function SourcesPage() {
  const notice = readFileSync(join(process.cwd(), 'data/TANZIL-NOTICE.txt'),'utf8');
  return <div className="site-shell method-page" dir="rtl"><header className="topbar"><a className="brand" href="/">عدسة الإسناد · IsnadLens</a><a href="/">العودة إلى مساحة الفحص ↗</a></header><main className="method-content"><p className="eyebrow">المصدر والإصدار وحقوق الاستخدام</p><h1>النص يبقى كما نشره مصدره.</h1><p>المصدر: <a href="https://tanzil.net" target="_blank" rel="noopener noreferrer">Tanzil Project</a>. إصدار Uthmani 1.1 لعرض النص، وإصدار Simple Clean 1.1 للبحث المطابق. حُفظ النص في كل إصدار دون تغيير، وربطناهما بموضع السورة والآية فقط.</p><p>Arabic source quotations are unchanged publisher text. English interface explanations are project-authored and are not authoritative Quran translations.</p><p><a href="https://tanzil.net/docs/Text_License" target="_blank" rel="noopener noreferrer">Tanzil text licence / شروط استخدام النص ↗</a></p><h2>إشعار الناشر الأصلي · Original publisher notices</h2><pre dir="ltr" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:'14px',lineHeight:1.7}}>{notice}</pre><p>هذه الصفحة لا تمنح مراجعة شرعية للتفسير الناتج عن النموذج. لا تحتوي المجموعة الحالية على الأحاديث أو ترجمات القرآن أو نصوص دليل الحج والعمرة.</p></main></div>;
}


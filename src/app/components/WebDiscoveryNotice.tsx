import type { DisplayLanguage } from '@/lib/display-copy';

const copy:Record<string,[string,string,string,string]>={
 en:['Online source search','References found online were checked against our source collection.','Published scholarly guidance — read the original ruling and its conditions.','Online search could not supply additional verified evidence.'],
 ar:['البحث في المصادر عبر الإنترنت','فُحصت المراجع المكتشفة بمقارنتها بمجموعة المصادر لدينا.','إرشاد علمي منشور — اقرأ الفتوى الأصلية وشروطها.','لم يوفر البحث أدلة إضافية موثقة.'],
 bn:['অনলাইন উৎস অনুসন্ধান','অনলাইনে পাওয়া তথ্যসূত্র আমাদের উৎসের সঙ্গে মিলিয়ে দেখা হয়েছে।','প্রকাশিত আলেমের নির্দেশনা — মূল সিদ্ধান্ত ও শর্ত পড়ুন।','অনুসন্ধানে অতিরিক্ত যাচাইকৃত প্রমাণ পাওয়া যায়নি।'],
 hi:['ऑनलाइन स्रोत खोज','ऑनलाइन मिले संदर्भों को हमारे स्रोत संग्रह से जाँचा गया।','प्रकाशित विद्वान का मार्गदर्शन — मूल निर्णय और शर्तें पढ़ें।','खोज से अतिरिक्त सत्यापित प्रमाण नहीं मिला।'],
 ur:['آن لائن مصادر کی تلاش','آن لائن ملنے والے حوالوں کو ہمارے مصادر سے جانچا گیا۔','شائع شدہ علمی رہنمائی — اصل فتویٰ اور شرائط پڑھیں۔','تلاش سے مزید تصدیق شدہ دلیل نہیں ملی۔'],
 id:['Pencarian sumber daring','Rujukan daring diperiksa terhadap koleksi sumber kami.','Panduan ulama yang diterbitkan — baca keputusan asli dan syaratnya.','Pencarian tidak menyediakan bukti terverifikasi tambahan.'],
 es:['Búsqueda de fuentes en línea','Las referencias encontradas se comprobaron con nuestra colección de fuentes.','Orientación académica publicada: lea el dictamen original y sus condiciones.','La búsqueda no aportó pruebas verificadas adicionales.'],
 fr:['Recherche de sources en ligne','Les références trouvées ont été vérifiées dans notre collection de sources.','Avis savant publié : lisez la décision originale et ses conditions.','La recherche n’a pas fourni de preuves vérifiées supplémentaires.'],
 de:['Online-Quellensuche','Gefundene Verweise wurden mit unserer Quellensammlung geprüft.','Veröffentlichte Gelehrtenauskunft: Lesen Sie die ursprüngliche Entscheidung und ihre Bedingungen.','Die Suche lieferte keine zusätzlichen geprüften Belege.'],
};
export type DiscoveryDisplay={status:string;verification_attempted:boolean;pages:{url:string;title:string;status:string;role:string}[]};
export function WebDiscoveryNotice({discovery,language}:{discovery:DiscoveryDisplay;language:DisplayLanguage}){
 const c=copy[language]??copy.en;
 return <div className="reason-notice"><strong>{c[0]}</strong><p>{discovery.verification_attempted?c[1]:c[3]}</p>{discovery.pages.filter(p=>p.status==='opened').map(p=><p key={p.url}><a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a>{p.role==='attributed_guidance_link'&&<><br/>{c[2]}</>}</p>)}</div>;
}

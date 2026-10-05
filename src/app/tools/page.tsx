'use client';
import {useEffect,useState} from 'react';
import {BrandMark} from '../components/WorkspaceIcon';
import {LocationPicker} from '../LocationPicker';
import {qiblaBearing,validCoordinates} from '@/lib/location-tools';
import {nextPrayer,countdownText,type PrayerSchedule} from '@/lib/prayer-clock';
import {CALENDAR_METHODS,PRAYER_METHODS,PRAYER_NAMES,type DatePair,type MonthCalendar,type PrayerTimes} from '@/lib/daily-tools';
function today(zone:string){const parts=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(type=>parts.find(part=>part.type===type)!.value).join('-');}
const arabicNames:Record<string,string>={Fajr:'الفجر',Sunrise:'الشروق',Dhuhr:'الظهر',Asr:'العصر',Maghrib:'المغرب',Isha:'العشاء'};
export default function DailyToolsPage(){
  const [ar,setAr]=useState(true);
  const [date,setDate]=useState('');
  const [latitude,setLatitude]=useState('21.4225');
  const [longitude,setLongitude]=useState('39.8262');
  const [method,setMethod]=useState(4);
  const [school,setSchool]=useState(0);
  const [calendarMethod,setCalendarMethod]=useState<typeof CALENDAR_METHODS[number]>('UAQ');
  const [prayers,setPrayers]=useState<PrayerSchedule|null>(null);
  const [calendar,setCalendar]=useState<MonthCalendar|null>(null);
  const [converted,setConverted]=useState<DatePair|null>(null);
  const [direction,setDirection]=useState<'gToH'|'hToG'>('gToH');
  const [conversionDate,setConversionDate]=useState('');
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [clock,setClock]=useState('');
  const [locating,setLocating]=useState(false);
  const [locationTimezone,setLocationTimezone]=useState<string|null>('Asia/Riyadh');
  const [now,setNow]=useState(0);
  useEffect(()=>{document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';},[ar]);
  const zone=prayers?.timezone??locationTimezone;
  const upcoming=prayers&&now?nextPrayer(prayers,new Date(now)):null;
  const qibla=latitude.trim()&&longitude.trim()&&validCoordinates(Number(latitude),Number(longitude))?qiblaBearing(Number(latitude),Number(longitude)):null;
  useEffect(()=>{const current=today('Asia/Riyadh');setDate(current);setConversionDate(current);},[]);
  useEffect(()=>{const update=()=>{setNow(Date.now());setClock(zone?new Intl.DateTimeFormat(ar?'ar-SA':'en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date()):'');};update();const timer=setInterval(update,1000);return()=>clearInterval(timer);},[zone,ar]);
  async function load(kind:'prayer'|'calendar'|'convert'){
    setBusy(kind);setError('');
    if(kind==='prayer')setPrayers(null);if(kind==='calendar')setCalendar(null);if(kind==='convert')setConverted(null);
    try{
      const params=new URLSearchParams({kind,calendarMethod});
      if(kind==='prayer')params.set('nextDay','1');
      if(kind==='prayer')for(const [key,value] of Object.entries({date,latitude,longitude,method:String(method),school:String(school)}))params.set(key,value);
      if(kind==='calendar'){const [year,month]=date.split('-');params.set('year',year);params.set('month',month);}
      if(kind==='convert'){params.set('date',conversionDate);params.set('direction',direction);}
      const response=await fetch(`/api/daily-tools?${params}`);const data=await response.json();
      if(!response.ok)throw new Error(data.error);
      if(kind==='prayer')setPrayers(data);if(kind==='calendar')setCalendar(data);if(kind==='convert')setConverted(data);
    }catch(err){setError(err instanceof Error&&err.message==='INPUT_INVALID'?(ar?'راجع التاريخ والإحداثيات وطريقة الحساب.':'Check the date, coordinates and calculation settings.'):(ar?'تعذّر تحميل البيانات. حاول مجدداً؛ لم نعرض أوقاتاً أو تواريخ بديلة.':'Data could not be loaded. Try again; no substitute times or dates are shown.'));}
    finally{setBusy('');}
  }
  function locate(){
    if(!navigator.geolocation){setError(ar?'الموقع غير متاح؛ أدخل الإحداثيات.':'Location is unavailable; enter coordinates.');return;}
    setLocating(true);setError('');
    navigator.geolocation.getCurrentPosition(position=>{setLatitude(position.coords.latitude.toFixed(6));setLongitude(position.coords.longitude.toFixed(6));setPrayers(null);setLocationTimezone(null);setLocating(false);},()=>{setError(ar?'لم يُحدد الموقع. يمكنك إدخاله يدوياً.':'Location was not obtained. You can enter it manually.');setLocating(false);},{timeout:10000,maximumAge:60000,enableHighAccuracy:false});
  }
  const pair=(value:DatePair)=><p><bdi>{value.gregorian.date}</bdi> · <span lang="ar">{value.hijri.day} {ar?value.hijri.month.ar:value.hijri.month.en} {value.hijri.year}</span></p>;
  const calendarCells=calendar?[...Array(new Date(Date.UTC(calendar.year,calendar.month-1,1)).getUTCDay()).fill(null),...calendar.days]:[];
  while(calendarCells.length%7)calendarCells.push(null);
  return <div className="site-shell daily-tools" dir={ar?'rtl':'ltr'}>
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark"><BrandMark/></span><strong>IsnadLens</strong></a><nav className="header-actions"><a className="method-link" href="/">{ar?'التحقق':'Verification'}</a><a className="method-link" href="/pilgrimage">{ar?'مرافق العمرة والحج':'Umrah & Hajj Companion'}</a><button onClick={()=>setAr(!ar)}>{ar?'English':'العربية'}</button></nav></header>
    <nav aria-label={ar?'الأدوات':'Tools'} style={{display:'flex',gap:20,flexWrap:'wrap',paddingBlock:16}}><a href="/">{ar?'التحقق الرئيسي':'Main verification'}</a><a href="/pilgrimage">{ar?'مرافق العمرة والحج':'Umrah & Hajj companion'}</a></nav>
    <main>
      <section className="hero"><div className="hero-copy"><h1>{ar?'المواقيت والتقويم':'Prayer times & calendar'}</h1><p className="hero-intro">{ar?'المواقيت حسب الموقع وطريقة الحساب المختارة. تحويل التاريخ وفق التقويم المحدد، وقد تختلف بداية الشهر بالرؤية المحلية.':'Prayer times use your chosen location and calculation method. Date conversion uses the selected calendar; local moon sighting may give a different month start.'}</p><p><time suppressHydrationWarning>{clock}</time> · <bdi>{zone??(ar?'ستحدد المنطقة الزمنية بعد طلب المواقيت':'Timezone determined after lookup')}</bdi></p></div></section>
      {error&&<p role="alert">{error}</p>}
      <fieldset disabled={Boolean(busy)} style={{border:0,padding:0,minWidth:0}}>
        <div className="desk-grid">
          <section id="prayer" className="result-panel" style={{minHeight:0}}><h2>{ar?'أوقات الصلاة':'Prayer times'}</h2>
            <form onSubmit={event=>{event.preventDefault();void load('prayer');}}>
              <label>{ar?'التاريخ الميلادي':'Gregorian date'}<input required type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={event=>{setDate(event.target.value);setCalendar(null);setPrayers(null);}}/></label>
              <LocationPicker ar={ar} latitude={latitude} longitude={longitude} onPick={location=>{setLatitude(String(location.latitude));setLongitude(String(location.longitude));setLocationTimezone(location.timezone??null);if(location.timezone)setDate(today(location.timezone));if(location.method)setMethod(location.method);setPrayers(null);setCalendar(null);}}/>
              <p>{ar?'الموقع الافتراضي: مكة. استخدم موقعك أو أدخل أي إحداثيات عالمية.':'Default location: Makkah. Use your location or enter coordinates anywhere worldwide.'}</p>
              <label>{ar?'خط العرض':'Latitude'}<input required type="number" min="-90" max="90" step="any" value={latitude} onChange={event=>{setLatitude(event.target.value);setPrayers(null);setLocationTimezone(null);}}/></label>
              <label>{ar?'خط الطول':'Longitude'}<input required type="number" min="-180" max="180" step="any" value={longitude} onChange={event=>{setLongitude(event.target.value);setPrayers(null);setLocationTimezone(null);}}/></label>
              <button type="button" disabled={locating} onClick={locate}>{locating?(ar?'جارٍ تحديد الموقع…':'Locating…'):(ar?'استخدم موقعي':'Use my location')}</button>
              <p>{ar?'تُرسل الإحداثيات إلى AlAdhan عند طلب المواقيت فقط. لا نحفظ موقعك في حساب.':'Coordinates are sent to AlAdhan when you request times. Your location is not saved in an account.'}</p>
              <label>{ar?'طريقة حساب الصلاة':'Prayer calculation method'}<select value={method} onChange={event=>{setMethod(Number(event.target.value));setPrayers(null);}}>{PRAYER_METHODS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>{ar?'حساب العصر':'Asr calculation'}<select value={school} onChange={event=>{setSchool(Number(event.target.value));setPrayers(null);}}><option value={0}>{ar?'القياسي':'Standard'}</option><option value={1}>{ar?'الحنفي':'Hanafi'}</option></select></label>
              <button className="primary-button" type="submit">{busy==='prayer'?(ar?'جارٍ التحميل…':'Loading…'):(ar?'اعرض المواقيت':'Show times')}</button>
            </form>
            {upcoming&&<div data-testid="next-prayer"><h3>{upcoming.status==='ready'?(ar?'موعد الصلاة التالي المحسوب':'Next calculated prayer time'):(ar?'العد التنازلي':'Countdown')}</h3>{upcoming.status==='ready'?<><p>{ar?arabicNames[upcoming.name]:upcoming.name} · <bdi>{upcoming.time}</bdi> · <bdi>{upcoming.date}</bdi></p><p><output aria-label={ar?'الوقت المتبقي':'Time remaining'}><bdi>{countdownText(upcoming.seconds)}</bdi></output></p>{upcoming.incomplete&&<p>{ar?'بعض المواقيت غير متاحة؛ هذا الموعد التالي المتاح فقط.':'Some times are unavailable; this is the next available time only.'}</p>}</>:<p>{upcoming.status==='different_date'?(ar?'اختر تاريخ اليوم في منطقة الموقع لعرض العد التنازلي.':'Choose today at the location to show a countdown.'):(ar?'أعد تحميل المواقيت للحصول على اليوم التالي.':'Reload times to get the following day.')}</p>}</div>}
            {prayers&&<div aria-live="polite">{pair(prayers.date)}<p>{prayers.method.name} · {prayers.school} · <bdi>{prayers.timezone}</bdi></p><table style={{width:'100%'}}><tbody>{PRAYER_NAMES.map(name=><tr key={name}><th scope="row" style={{textAlign:'start',padding:8}}>{ar?arabicNames[name]:name}</th><td><bdi>{prayers.timings[name]??(ar?'غير متاح':'Unavailable')}</bdi></td></tr>)}</tbody></table><p>{ar?'هذه أوقات محسوبة، وليست مواعيد إقامة المسجد. الشروق ليس صلاة مفروضة. راجع جدول مسجدك المحلي.':'These are calculated times, not mosque iqamah times. Sunrise is not an obligatory prayer. Check your local mosque timetable.'}</p><details><summary>{ar?'الموقع والحساب':'Location and calculation'}</summary><p><bdi>{prayers.latitude}, {prayers.longitude}</bdi> · {prayers.highLatitudeRule}</p></details></div>}
          </section>
          <section id="calendar" className="result-panel" style={{minHeight:0}}><h2>{ar?'التقويم وتحويل التاريخ':'Calendar & date conversion'}</h2>
            <label>{ar?'طريقة التقويم الهجري':'Hijri calendar method'}<select value={calendarMethod} onChange={event=>{setCalendarMethod(event.target.value as typeof calendarMethod);setConverted(null);setCalendar(null);setPrayers(null);}}>{CALENDAR_METHODS.map(item=><option value={item} key={item}>{item==='UAQ'?(ar?'أم القرى · UAQ':'Umm al-Qura · UAQ'):item}</option>)}</select></label>
            <form onSubmit={event=>{event.preventDefault();void load('convert');}} onChange={()=>setConverted(null)}>
              <label>{ar?'اتجاه التحويل':'Conversion direction'}<select value={direction} onChange={event=>{setDirection(event.target.value as typeof direction);setConversionDate('');}}><option value="gToH">{ar?'ميلادي إلى هجري':'Gregorian → Hijri'}</option><option value="hToG">{ar?'هجري إلى ميلادي':'Hijri → Gregorian'}</option></select></label>
              <label>{direction==='gToH'?(ar?'التاريخ الميلادي':'Gregorian date'):(ar?'التاريخ الهجري: السنة-الشهر-اليوم':'Hijri date: year-month-day')}<input required type={direction==='gToH'?'date':'text'} dir="ltr" placeholder={direction==='hToG'?'1448-09-01':undefined} pattern={direction==='hToG'?'[0-9]{4}-[0-9]{2}-[0-9]{2}':undefined} value={conversionDate} onChange={event=>setConversionDate(event.target.value)}/></label>
              <button className="primary-button" type="submit">{busy==='convert'?(ar?'جارٍ التحويل…':'Converting…'):(ar?'حوّل التاريخ':'Convert date')}</button>
            </form>
            {converted&&<div aria-live="polite">{pair(converted)}<p>{calendarMethod} · AlAdhan</p></div>}
            <h3>{ar?'تقويم الشهر':'Month calendar'}</h3>
            <label>{ar?'الشهر الميلادي':'Gregorian month'}<input type="month" min="1900-01" max="2100-12" value={date.slice(0,7)} onChange={event=>{setDate(`${event.target.value}-01`);setCalendar(null);setPrayers(null);}}/></label>
            <button type="button" className="primary-button" onClick={()=>void load('calendar')}>{busy==='calendar'?(ar?'جارٍ التحميل…':'Loading…'):(ar?'اعرض الشهر':'Show month')}</button>
            {calendar&&<div aria-live="polite"><p><bdi>{calendar.year}-{String(calendar.month).padStart(2,'0')}</bdi> · {calendar.method}</p><table style={{width:'100%',tableLayout:'fixed',direction:'ltr'}}><thead><tr>{(ar?['ح','ن','ث','ر','خ','ج','س']:['Su','Mo','Tu','We','Th','Fr','Sa']).map((day,index)=><th key={index} scope="col">{day}</th>)}</tr></thead><tbody>{Array.from({length:calendarCells.length/7},(_,row)=><tr key={row}>{calendarCells.slice(row*7,row*7+7).map((day:DatePair|null,index)=><td key={index} style={{textAlign:'center',padding:'8px 1px',borderBottom:'1px solid var(--line)'}}>{day&&<><bdi>{Number(day.gregorian.day)}</bdi><small style={{display:'block'}}>{day.hijri.day}/{day.hijri.month.number}</small></>}</td>)}</tr>)}</tbody></table><p>{ar?'الرقم الكبير ميلادي، والصغير اليوم/الشهر الهجري.':'Large number: Gregorian day. Small number: Hijri day/month.'}</p></div>}
            <p>{ar?'التاريخ المحوّل حساب تقويمي؛ لا يعلن دخول رمضان أو العيد ولا يستبدل إعلان الجهة المحلية.':'Converted dates are calendar calculations; they do not announce Ramadan or Eid and do not replace local authority announcements.'}</p>
          </section>
        </div>
        <section id="qibla" className="coverage-box"><h2>{ar?'اتجاه القبلة':'Qibla direction'}</h2><p>{ar?'يستخدم الإحداثيات المحددة أعلاه، ويحسب على جهازك.':'Uses the coordinates selected above and calculates on your device.'}</p>{qibla?.status==='ready'?<><svg role="img" aria-label={ar?'اتجاه القبلة من الشمال الحقيقي':'Qibla bearing from true north'} viewBox="0 0 160 160" width="160" height="160"><circle cx="80" cy="80" r="62" fill="none" stroke="currentColor"/><text x="80" y="12" textAnchor="middle">N</text><path d="M80 126 L80 36 M65 54 L80 36 L95 54" fill="none" stroke="currentColor" strokeWidth="5" transform={`rotate(${qibla.degrees} 80 80)`}/></svg><p><bdi>{qibla.degrees.toFixed(1)}°</bdi> · {ar?'باتجاه عقارب الساعة من الشمال الحقيقي':'clockwise from true north'}</p><p>{ar?'ليست بوصلة هاتف حية. وجّه الشمال الحقيقي أولاً؛ قد يختلف الشمال المغناطيسي.':'This is not a live phone compass. Orient true north first; magnetic north may differ.'}</p></>:<p>{qibla?.status==='near_kaaba'?(ar?'الإحداثيات المحددة قريبة جداً من الكعبة؛ اتبع الاتجاه المشاهد والإرشاد المحلي.':'The selected coordinates are very close to the Kaaba; use its visible direction and local guidance.'):(ar?'يلزم موقع صالح لحساب الاتجاه.':'A valid location is needed to calculate a bearing.')}</p>}</section>
      </fieldset>
      <p><a href="https://aladhan.com/prayer-times-api" target="_blank" rel="noopener noreferrer">AlAdhan · {ar?'مصدر المواقيت':'Prayer source'} ↗</a> · <a href="https://aladhan.com/islamic-calendar-api" target="_blank" rel="noopener noreferrer">{ar?'مصدر التقويم':'Calendar source'} ↗</a></p>
    </main>
  </div>;
}

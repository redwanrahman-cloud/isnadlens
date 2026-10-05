import {z} from 'zod';

export const PRAYER_METHODS = [
  {id:4,name:'Umm al-Qura · Makkah'}, {id:3,name:'Muslim World League'},
  {id:2,name:'ISNA · North America'}, {id:5,name:'Egyptian General Authority'},
  {id:1,name:'University of Islamic Sciences · Karachi'}, {id:12,name:'Diyanet · Turkey'},
  {id:11,name:'UOIF · France'}, {id:20,name:'Kemenag · Indonesia'}, {id:15,name:'Moonsighting Committee'},
] as const;
export const PRAYER_NAMES = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'] as const;
export const CALENDAR_METHODS = ['UAQ','HJCoSA','DIYANET','MATHEMATICAL'] as const;
export type CalendarMethod = typeof CALENDAR_METHODS[number];
const providerDate = z.object({date:z.string().regex(/^\d{2}-\d{2}-\d{4}$/),day:z.string(),month:z.object({number:z.number().int(),en:z.string(),ar:z.string().optional(),days:z.number().int().optional()}),year:z.string()});
const datePair = z.object({gregorian:providerDate,hijri:providerDate.extend({method:z.string()})});
export type DatePair = z.infer<typeof datePair>;

export function gregorianDate(value:string):string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('DATE_INVALID');
  const [year,month,day] = value.split('-').map(Number);
  if (year < 1900 || year > 2100) throw new Error('DATE_INVALID');
  const date = new Date(Date.UTC(year,month-1,day));
  if (date.getUTCFullYear()!==year || date.getUTCMonth()!==month-1 || date.getUTCDate()!==day) throw new Error('DATE_INVALID');
  return `${String(day).padStart(2,'0')}-${String(month).padStart(2,'0')}-${year}`;
}
export function hijriDate(value:string):string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('DATE_INVALID');
  const [year,month,day]=value.split('-').map(Number);
  if (year<1300||year>1600||month<1||month>12||day<1||day>30) throw new Error('DATE_INVALID');
  return `${String(day).padStart(2,'0')}-${String(month).padStart(2,'0')}-${year}`;
}
function calendarMethod(value:string):CalendarMethod {
  if (!CALENDAR_METHODS.includes(value as CalendarMethod)) throw new Error('INPUT_INVALID');
  return value as CalendarMethod;
}
async function fetchProvider(path:string,params:Record<string,string>):Promise<unknown> {
  const url = new URL(`https://api.aladhan.com/v1/${path}`);
  for (const [key,value] of Object.entries(params)) url.searchParams.set(key,value);
  const response=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'},cache:'no-store'});
  if (!response.ok) throw new Error('DAILY_PROVIDER_UNAVAILABLE');
  const text=await response.text();
  if (text.length>150000) throw new Error('DAILY_PROVIDER_INVALID');
  const envelope=z.object({code:z.literal(200),data:z.unknown()}).parse(JSON.parse(text));
  return envelope.data;
}
function validatePair(raw:unknown,method:CalendarMethod):DatePair {
  const pair=datePair.parse(raw);
  if (pair.hijri.method!==method) throw new Error('DAILY_METHOD_MISMATCH');
  const g=`${pair.gregorian.year}-${String(pair.gregorian.month.number).padStart(2,'0')}-${pair.gregorian.day.padStart(2,'0')}`;
  const h=`${pair.hijri.year}-${String(pair.hijri.month.number).padStart(2,'0')}-${pair.hijri.day.padStart(2,'0')}`;
  if (gregorianDate(g)!==pair.gregorian.date||hijriDate(h)!==pair.hijri.date) throw new Error('DAILY_PROVIDER_INVALID');
  if (pair.hijri.month.days && Number(pair.hijri.day)>pair.hijri.month.days) throw new Error('DATE_INVALID');
  return pair;
}
export async function convertDate(direction:'gToH'|'hToG',date:string,method:CalendarMethod='UAQ') {
  if (!['gToH','hToG'].includes(direction)) throw new Error('INPUT_INVALID');
  method=calendarMethod(method);
  const requested=direction==='gToH'?gregorianDate(date):hijriDate(date);
  const pair=validatePair(await fetchProvider(`${direction}/${requested}`,{calendarMethod:method}),method);
  if (pair[direction==='gToH'?'gregorian':'hijri'].date!==requested) throw new Error('DATE_INVALID');
  return {source:'AlAdhan',method,...pair};
}
export async function monthCalendar(year:number,month:number,method:CalendarMethod='UAQ') {
  if (!Number.isInteger(year)||!Number.isInteger(month)) throw new Error('DATE_INVALID');
  gregorianDate(`${year}-${String(month).padStart(2,'0')}-01`);
  method=calendarMethod(method);
  const raw=await fetchProvider(`gToHCalendar/${month}/${year}`,{calendarMethod:method});
  if (!Array.isArray(raw)||raw.length<28||raw.length>31) throw new Error('DAILY_PROVIDER_INVALID');
  const days=raw.map(value=>validatePair(value,method));
  const expected=new Date(Date.UTC(year,month,0)).getUTCDate();
  if (days.length!==expected||days.some((pair,index)=>pair.gregorian.date!==`${String(index+1).padStart(2,'0')}-${String(month).padStart(2,'0')}-${year}`)) throw new Error('DAILY_PROVIDER_INVALID');
  return {source:'AlAdhan',method,year,month,days};
}
export async function prayerTimes(input:{date:string;latitude:number;longitude:number;method:number;school:number;calendarMethod:CalendarMethod}) {
  const date=gregorianDate(input.date);
  if (!Number.isFinite(input.latitude)||Math.abs(input.latitude)>90||!Number.isFinite(input.longitude)||Math.abs(input.longitude)>180||!PRAYER_METHODS.some(method=>method.id===input.method)||![0,1].includes(input.school)) throw new Error('INPUT_INVALID');
  const method=calendarMethod(input.calendarMethod);
  const raw=await fetchProvider(`timings/${date}`,{latitude:String(input.latitude),longitude:String(input.longitude),method:String(input.method),school:String(input.school),calendarMethod:method});
  const packet=z.object({timings:z.record(z.string(),z.string()),date:datePair,meta:z.object({latitude:z.number(),longitude:z.number(),timezone:z.string(),method:z.object({id:z.number(),name:z.string()}),school:z.string(),latitudeAdjustmentMethod:z.string()})}).parse(raw);
  const pair=validatePair(packet.date,method);
  if (pair.gregorian.date!==date||Math.abs(packet.meta.latitude-input.latitude)>.01||Math.abs(packet.meta.longitude-input.longitude)>.01||packet.meta.method.id!==input.method||packet.meta.school!==(input.school===1?'HANAFI':'STANDARD')) throw new Error('DAILY_REQUEST_MISMATCH');
  try { new Intl.DateTimeFormat('en',{timeZone:packet.meta.timezone}); } catch { throw new Error('DAILY_PROVIDER_INVALID'); }
  const timings=Object.fromEntries(PRAYER_NAMES.map(name=>{
    const time=packet.timings[name];
    if (!time) throw new Error('DAILY_PROVIDER_INVALID');
    const match=/^(\d{2}):(\d{2})(?:\s.*)?$/.exec(time);
    const valid=match&&Number(match[1])<24&&Number(match[2])<60;
    if (!valid && !/^(?:--:--|NaN:NaN|Invalid date)$/.test(time)) throw new Error('DAILY_PROVIDER_INVALID');
    return [name,valid?`${match[1]}:${match[2]}`:null];
  })) as Record<typeof PRAYER_NAMES[number],string|null>;
  return {source:'AlAdhan',date:pair,timings,timezone:packet.meta.timezone,latitude:packet.meta.latitude,longitude:packet.meta.longitude,method:packet.meta.method,school:packet.meta.school,highLatitudeRule:packet.meta.latitudeAdjustmentMethod};
}
export type PrayerTimes = Awaited<ReturnType<typeof prayerTimes>>;
export type MonthCalendar = Awaited<ReturnType<typeof monthCalendar>>;

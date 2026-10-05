import type {PrayerTimes} from './daily-tools';
export type PrayerSchedule=PrayerTimes&{next_day?:PrayerTimes|null};
const obligatory=['Fajr','Dhuhr','Asr','Maghrib','Isha'] as const;
const instantCache=new Map<string,number|null>();
function wallParts(now:Date,zone:string){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
  return Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)]));
}
export function localDay(now:Date,zone:string){const p=wallParts(now,zone);return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;}
export function nextDay(date:string){const [year,month,day]=date.split('-').map(Number);return new Date(Date.UTC(year,month-1,day+1)).toISOString().slice(0,10);}
/** Convert the location's wall time, never the browser's timezone. Reject DST ambiguity/gaps. */
export function localPrayerInstant(date:string,time:string,zone:string):number|null{
  const [year,month,day]=date.split('-').map(Number);const [hour,minute]=time.split(':').map(Number);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)||hour>23||minute>59)return null;
  const key=`${zone}:${date}:${time}`;
  if(instantCache.has(key))return instantCache.get(key)!;
  const target=Date.UTC(year,month-1,day,hour,minute);
  try{
    // Sample both sides of a possible transition, including half-hour and multi-hour shifts.
    const offsets=new Set<number>();
    for(let hours=-36;hours<=36;hours+=6){const instant=target+hours*3600000;const p=wallParts(new Date(instant),zone);offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-instant);}
    const matches=[...offsets].map(offset=>target-offset).filter(value=>{const p=wallParts(new Date(value),zone);return p.year===year&&p.month===month&&p.day===day&&p.hour===hour&&p.minute===minute;});
    const result=matches.length===1?matches[0]:null;
    if(instantCache.size>=256)instantCache.delete(instantCache.keys().next().value!);
    instantCache.set(key,result);return result;
  }catch{return null;}
}
const packetDay=(packet:PrayerTimes)=>`${packet.date.gregorian.year}-${String(packet.date.gregorian.month.number).padStart(2,'0')}-${packet.date.gregorian.day.padStart(2,'0')}`;
export function nextPrayer(schedule:PrayerSchedule,now:Date):{status:'ready';name:typeof obligatory[number];time:string;date:string;seconds:number;incomplete:boolean}|{status:'different_date'|'reload_required'}{
  const day=localDay(now,schedule.timezone);
  const packets=[schedule,schedule.next_day].filter((packet):packet is PrayerTimes=>Boolean(packet)&&packet!.timezone===schedule.timezone);
  if(!packets.some(packet=>packetDay(packet)===day))return {status:'different_date'};
  const candidates=packets.filter(packet=>[day,nextDay(day)].includes(packetDay(packet))).flatMap(packet=>obligatory.flatMap(name=>{
    const time=packet.timings[name];if(!time)return [];
    const date=packetDay(packet),instant=localPrayerInstant(date,time,packet.timezone);
    return instant!==null&&instant>=now.getTime()?[{name,time,date,instant}]:[];
  })).sort((a,b)=>a.instant-b.instant);
  if(!candidates.length)return {status:'reload_required'};
  const candidate=candidates[0];
  return {status:'ready',name:candidate.name,time:candidate.time,date:candidate.date,seconds:Math.ceil((candidate.instant-now.getTime())/1000),incomplete:packets.some(packet=>obligatory.some(name=>packet.timings[name]===null))};
}
export function countdownText(seconds:number){const value=Math.max(0,Math.floor(seconds));return `${String(Math.floor(value/3600)).padStart(2,'0')}:${String(Math.floor(value%3600/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}

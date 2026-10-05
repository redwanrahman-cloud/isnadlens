import {afterEach,describe,expect,it,vi} from 'vitest';
import {convertDate,gregorianDate,hijriDate,monthCalendar,prayerTimes} from '../src/lib/daily-tools';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
function pair(day='05',month=10,year='2026'){return {gregorian:{date:`${day}-${String(month).padStart(2,'0')}-${year}`,day,month:{number:month,en:'October'},year},hijri:{date:'24-04-1448',day:'24',month:{number:4,en:'Rabi al-thani',ar:'ربيع الثاني',days:30},year:'1448',method:'UAQ'}};}
function response(data:unknown){return new Response(JSON.stringify({code:200,data}));}
const request={date:'2026-10-05',latitude:21.4225,longitude:39.8262,method:4,school:0,calendarMethod:'UAQ' as const};
function timings(){return {timings:{Fajr:'04:57',Sunrise:'06:13',Dhuhr:'12:09',Asr:'15:33',Maghrib:'18:05',Isha:'19:35'},date:pair(),meta:{latitude:21.4225,longitude:39.8262,timezone:'Asia/Riyadh',method:{id:4,name:'Umm al-Qura'},school:'STANDARD',latitudeAdjustmentMethod:'ANGLE_BASED'}};}
describe('calculated daily tools',()=>{
  it('validates Gregorian leap days and Hijri bounds before networking',async()=>{
    expect(gregorianDate('2024-02-29')).toBe('29-02-2024');
    for(const date of ['2026-02-29','2026-04-31','2026-13-01','05-10-2026','1800-01-01'])expect(()=>gregorianDate(date)).toThrow('DATE_INVALID');
    expect(hijriDate('1448-09-30')).toBe('30-09-1448');
    for(const date of ['1448-13-01','1448-09-31','1448-00-01'])expect(()=>hijriDate(date)).toThrow('DATE_INVALID');
    const network=vi.fn();vi.stubGlobal('fetch',network);
    await expect(prayerTimes({...request,latitude:NaN})).rejects.toThrow('INPUT_INVALID');
    await expect(convertDate('gToH','2026-04-31')).rejects.toThrow('DATE_INVALID');
    expect(network).not.toHaveBeenCalled();
  });
  it('requests a fixed provider and preserves its matching date and method in both directions',async()=>{
    const network=vi.fn(async(_url:string|URL,_options?:RequestInit)=>response(pair()));vi.stubGlobal('fetch',network);
    expect((await convertDate('gToH','2026-10-05')).hijri.date).toBe('24-04-1448');
    expect((await convertDate('hToG','1448-04-24')).gregorian.date).toBe('05-10-2026');
    expect(String(network.mock.calls[0][0])).toBe('https://api.aladhan.com/v1/gToH/05-10-2026?calendarMethod=UAQ');
  });
  it('rejects provider normalization of nonexistent Hijri days or a different calculation method',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>response(pair())));
    await expect(convertDate('hToG','1448-04-30')).rejects.toThrow('DATE_INVALID');
    await expect(convertDate('gToH','2026-10-05','MATHEMATICAL')).rejects.toThrow('METHOD_MISMATCH');
  });
  it('keeps local timezone and Asr method instead of using the device timezone',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>response(timings())));
    const result=await prayerTimes(request);
    expect(result.timezone).toBe('Asia/Riyadh');expect(result.timings.Fajr).toBe('04:57');expect(result.school).toBe('STANDARD');
  });
  it.each(['location','method','date','school','timezone'])('rejects incorrect returned %s rather than displaying plausible times',async field=>{
    const packet=timings();
    if(field==='location')packet.meta.latitude=8.888;
    if(field==='method')packet.meta.method.id=3;
    if(field==='date')packet.date=pair('06');
    if(field==='school')packet.meta.school='HANAFI';
    if(field==='timezone')packet.meta.timezone='Fake/Zone';
    vi.stubGlobal('fetch',vi.fn(async()=>response(packet)));
    await expect(prayerTimes(request)).rejects.toThrow();
  });
  it('retains unavailable high-latitude times without inventing replacements',async()=>{
    const packet=timings();packet.timings.Fajr='--:--';
    vi.stubGlobal('fetch',vi.fn(async()=>response(packet)));
    expect((await prayerTimes(request)).timings.Fajr).toBeNull();
    packet.timings.Isha='25:90';await expect(prayerTimes(request)).rejects.toThrow('PROVIDER_INVALID');
  });
  it('requires a complete ordered month, rejecting duplicate or missing days',async()=>{
    const days=Array.from({length:31},(_,index)=>pair(String(index+1).padStart(2,'0')));
    vi.stubGlobal('fetch',vi.fn(async()=>response(days)));
    expect((await monthCalendar(2026,10)).days).toHaveLength(31);
    days[12]=days[11];await expect(monthCalendar(2026,10)).rejects.toThrow('PROVIDER_INVALID');
  });
  it('does not silently substitute data after an upstream outage',async()=>{
    const network=vi.fn(async()=>new Response('{}',{status:429}));vi.stubGlobal('fetch',network);
    await expect(prayerTimes(request)).rejects.toThrow('PROVIDER_UNAVAILABLE');expect(network).toHaveBeenCalledOnce();
  });
});

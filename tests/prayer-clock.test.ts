import {describe,expect,it} from 'vitest';
import {localDay,localPrayerInstant,nextDay,nextPrayer,countdownText,type PrayerSchedule} from '../src/lib/prayer-clock';
function packet(day='05'):PrayerSchedule{return {source:'AlAdhan',date:{gregorian:{date:`${day}-10-2026`,day,month:{number:10,en:'October'},year:'2026'},hijri:{date:'24-04-1448',day:'24',month:{number:4,en:'Rabi'},year:'1448',method:'UAQ'}},timings:{Fajr:'04:57',Sunrise:'06:13',Dhuhr:'12:09',Asr:'15:33',Maghrib:'18:05',Isha:'19:35'},timezone:'Asia/Riyadh',latitude:21.4225,longitude:39.8262,method:{id:4,name:'Umm al-Qura'},school:'STANDARD',highLatitudeRule:'ANGLE_BASED'};}
describe('location-based prayer countdown',()=>{
  it('uses the location date and handles month/leap/year rollovers',()=>{
    expect(localDay(new Date('2026-10-05T22:00:00Z'),'Asia/Riyadh')).toBe('2026-10-06');
    expect(localDay(new Date('2026-10-05T02:00:00Z'),'America/New_York')).toBe('2026-10-04');
    expect(nextDay('2024-02-28')).toBe('2024-02-29');expect(nextDay('2026-12-31')).toBe('2027-01-01');
  });
  it('converts wall times independently of the browser timezone',()=>{
    expect(localPrayerInstant('2026-10-05','15:33','Asia/Riyadh')).toBe(Date.parse('2026-10-05T12:33:00Z'));
    expect(localPrayerInstant('2026-10-05','05:16','Europe/London')).toBe(Date.parse('2026-10-05T04:16:00Z'));
  });
  it('refuses nonexistent or ambiguous DST wall times and invalid times',()=>{
    expect(localPrayerInstant('2026-03-29','01:30','Europe/London')).toBeNull();
    expect(localPrayerInstant('2026-10-25','01:30','Europe/London')).toBeNull();
    expect(localPrayerInstant('2026-04-05','01:45','Australia/Lord_Howe')).toBeNull();
    expect(localPrayerInstant('2026-10-04','02:15','Australia/Lord_Howe')).toBeNull();
    expect(localPrayerInstant('2026-10-05','25:00','Asia/Riyadh')).toBeNull();
  });
  it('excludes sunrise from obligatory prayer selection',()=>{
    const result=nextPrayer(packet(),new Date('2026-10-05T02:30:00Z'));
    expect(result.status).toBe('ready');if(result.status==='ready'){expect(result.name).toBe('Dhuhr');expect(result.seconds).toBe(23940);}
  });
  it('uses tomorrow actual Fajr after Isha, not a repeated today time',()=>{
    const schedule=packet();schedule.next_day=packet('06');schedule.next_day.timings.Fajr='04:58';
    const result=nextPrayer(schedule,new Date('2026-10-05T17:00:00Z'));
    expect(result).toMatchObject({status:'ready',name:'Fajr',date:'2026-10-06',time:'04:58',seconds:32280});
    expect(nextPrayer(packet(),new Date('2026-10-05T17:00:00Z'))).toEqual({status:'reload_required'});
  });
  it('continues across local midnight but refuses stale or future-only schedules',()=>{
    const schedule=packet();schedule.next_day=packet('06');
    expect(nextPrayer(schedule,new Date('2026-10-05T22:00:00Z'))).toMatchObject({status:'ready',name:'Fajr',date:'2026-10-06'});
    expect(nextPrayer(schedule,new Date('2026-10-08T11:00:00Z'))).toEqual({status:'different_date'});
  });
  it('marks missing high-latitude times and formats hours without wrapping at 24',()=>{
    const schedule=packet();schedule.timings.Fajr=null;
    expect(nextPrayer(schedule,new Date('2026-10-05T00:00:00Z'))).toMatchObject({status:'ready',name:'Dhuhr',incomplete:true});
    expect(countdownText(90061)).toBe('25:01:01');expect(countdownText(-1)).toBe('00:00:00');
  });
});

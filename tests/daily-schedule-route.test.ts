import {afterEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({prayer:vi.fn(),convert:vi.fn(),month:vi.fn()}));
vi.mock('../src/lib/daily-tools',()=>({prayerTimes:mocks.prayer,convertDate:mocks.convert,monthCalendar:mocks.month}));
import {GET} from '../src/app/api/daily-tools/route';
afterEach(()=>vi.resetAllMocks());
function request(next=false){return new NextRequest(`http://localhost/api/daily-tools?kind=prayer&date=2026-12-31&latitude=51.5&longitude=-0.1&method=3&school=0${next?'&nextDay=1':''}`);}
it('preserves the original single-day API shape unless requested',async()=>{
  mocks.prayer.mockResolvedValue({timings:{Fajr:'06:00'}});const result=await GET(request());expect(await result.json()).toEqual({timings:{Fajr:'06:00'}});expect(mocks.prayer).toHaveBeenCalledOnce();
});
it('requests the following date across the year boundary with identical location and method',async()=>{
  mocks.prayer.mockResolvedValueOnce({timings:{Fajr:'06:00'}}).mockResolvedValueOnce({timings:{Fajr:'06:01'}});
  const result=await GET(request(true));expect((await result.json()).next_day.timings.Fajr).toBe('06:01');
  expect(mocks.prayer.mock.calls[1][0]).toEqual({...mocks.prayer.mock.calls[0][0],date:'2027-01-01'});
});
it('retains validated today times if tomorrow fails rather than copying today into tomorrow',async()=>{
  mocks.prayer.mockResolvedValueOnce({timings:{Fajr:'06:00'}}).mockRejectedValueOnce(new Error('provider unavailable'));
  const result=await GET(request(true));expect(result.status).toBe(200);expect(await result.json()).toEqual({timings:{Fajr:'06:00'},next_day:null});
});

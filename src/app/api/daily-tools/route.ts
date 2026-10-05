import {NextRequest,NextResponse} from 'next/server';
import {convertDate,monthCalendar,prayerTimes,type CalendarMethod} from '@/lib/daily-tools';
export const runtime='nodejs';
export const dynamic='force-dynamic';
let active=0;
const windows=new Map<string,{start:number;count:number}>();
export async function GET(request:NextRequest) {
  const now=Date.now();
  for (const [id,item] of windows) if (now-item.start>60000) windows.delete(id);
  const id=request.headers.get('x-real-ip')??'local';
  const bucket=windows.get(id)??{start:now,count:0};
  if (active>=4||bucket.count>=30||windows.size>1000) return NextResponse.json({error:'RATE_LIMITED'},{status:429});
  bucket.count++;windows.set(id,bucket);
  const params=request.nextUrl.searchParams;
  const method=(params.get('calendarMethod')??'UAQ') as CalendarMethod;
  active++;
  try {
    let result;
    if (params.get('kind')==='convert') result=await convertDate(params.get('direction') as 'gToH'|'hToG',params.get('date')??'',method);
    else if (params.get('kind')==='calendar') result=await monthCalendar(Number(params.get('year')),Number(params.get('month')),method);
    else if (params.get('kind')==='prayer') {
      if (['latitude','longitude','method','school'].some(key=>params.get(key)===null||params.get(key)==='')) throw new Error('INPUT_INVALID');
      result=await prayerTimes({date:params.get('date')??'',latitude:Number(params.get('latitude')),longitude:Number(params.get('longitude')),method:Number(params.get('method')),school:Number(params.get('school')),calendarMethod:method});
    } else throw new Error('INPUT_INVALID');
    return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    const invalid=error instanceof Error&&['DATE_INVALID','INPUT_INVALID'].includes(error.message);
    return NextResponse.json({error:invalid?'INPUT_INVALID':'DAILY_TOOLS_UNAVAILABLE'},{status:invalid?400:503});
  } finally {active--;}
}

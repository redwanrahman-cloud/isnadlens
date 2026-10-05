export type SavedLocation={id:string;name:string;latitude:number;longitude:number};
export const LOCATION_PRESETS=[
  {id:'makkah',name:'Makkah · مكة',latitude:21.4225,longitude:39.8262,timezone:'Asia/Riyadh',method:4},
  {id:'madinah',name:'Madinah · المدينة',latitude:24.4672,longitude:39.6111,timezone:'Asia/Riyadh',method:4},
  {id:'riyadh',name:'Riyadh · الرياض',latitude:24.7136,longitude:46.6753,timezone:'Asia/Riyadh',method:4},
  {id:'dhaka',name:'Dhaka · ঢাকা',latitude:23.8103,longitude:90.4125,timezone:'Asia/Dhaka',method:1},
  {id:'karachi',name:'Karachi · کراچی',latitude:24.8607,longitude:67.0011,timezone:'Asia/Karachi',method:1},
  {id:'delhi',name:'Delhi · दिल्ली',latitude:28.6139,longitude:77.209,timezone:'Asia/Kolkata',method:1},
  {id:'jakarta',name:'Jakarta',latitude:-6.2088,longitude:106.8456,timezone:'Asia/Jakarta',method:20},
  {id:'london',name:'London',latitude:51.5074,longitude:-.1278,timezone:'Europe/London',method:3},
  {id:'paris',name:'Paris',latitude:48.8566,longitude:2.3522,timezone:'Europe/Paris',method:11},
  {id:'berlin',name:'Berlin',latitude:52.52,longitude:13.405,timezone:'Europe/Berlin',method:3},
  {id:'new-york',name:'New York',latitude:40.7128,longitude:-74.006,timezone:'America/New_York',method:2},
  {id:'sydney',name:'Sydney',latitude:-33.8688,longitude:151.2093,timezone:'Australia/Sydney',method:3},
] as const;
export function validCoordinates(latitude:number,longitude:number){return Number.isFinite(latitude)&&Math.abs(latitude)<=90&&Number.isFinite(longitude)&&Math.abs(longitude)<=180;}
/** Initial great-circle bearing measured clockwise from true north. No phone compass claim. */
export function qiblaBearing(latitude:number,longitude:number):{status:'ready';degrees:number;distanceKm:number}|{status:'near_kaaba'|'undefined'}{
  if(!validCoordinates(latitude,longitude))throw new Error('LOCATION_INVALID');
  if(Math.abs(latitude)>=89.999999)return {status:'undefined'};
  const rad=(value:number)=>value*Math.PI/180;
  const lat=rad(latitude),target=rad(21.4225),delta=rad(39.8262-longitude);
  const y=Math.sin(delta)*Math.cos(target),x=Math.cos(lat)*Math.sin(target)-Math.sin(lat)*Math.cos(target)*Math.cos(delta);
  const a=Math.sin((target-lat)/2)**2+Math.cos(lat)*Math.cos(target)*Math.sin(delta/2)**2;
  const distanceKm=6371*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,a))));
  if(distanceKm<.1)return {status:'near_kaaba'};
  if(Math.hypot(x,y)<1e-12)return {status:'undefined'};
  return {status:'ready',degrees:(Math.atan2(y,x)*180/Math.PI+360)%360,distanceKm};
}
export function restoreLocations(serialized:string):SavedLocation[]|null{
  if(serialized.length>8192)return null;
  try{
    const data=JSON.parse(serialized);
    if(data.version!==1||!Array.isArray(data.locations)||data.locations.length>8)return null;
    const seen=new Set<string>();const locations:SavedLocation[]=[];
    for(const location of data.locations){
      if(!location||typeof location.id!=='string'||!location.id||location.id.length>64||seen.has(location.id)||typeof location.name!=='string'||!location.name.trim()||location.name.length>60||!validCoordinates(location.latitude,location.longitude))return null;
      seen.add(location.id);locations.push({id:location.id,name:location.name.trim(),latitude:location.latitude,longitude:location.longitude});
    }
    return locations;
  }catch{return null;}
}

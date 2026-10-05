import {expect,it} from 'vitest';
import {qiblaBearing,restoreLocations,LOCATION_PRESETS} from '../src/lib/location-tools';
it('matches the public AlAdhan London bearing and keeps every preset in range',()=>{
  const london=qiblaBearing(51.5074,-.1278);expect(london.status).toBe('ready');if(london.status==='ready')expect(london.degrees).toBeCloseTo(118.98724251452296,3);
  for(const location of LOCATION_PRESETS){const result=qiblaBearing(location.latitude,location.longitude);if(result.status==='ready'){expect(result.degrees).toBeGreaterThanOrEqual(0);expect(result.degrees).toBeLessThan(360);expect(result.distanceKm).toBeGreaterThan(0);}}
});
it('does not invent a bearing at the Kaaba or its antipode',()=>{
  expect(qiblaBearing(21.4225,39.8262)).toEqual({status:'near_kaaba'});
  expect(qiblaBearing(-21.4225,-140.1738)).toEqual({status:'undefined'});
  expect(qiblaBearing(90,0)).toEqual({status:'undefined'});expect(qiblaBearing(-90,0)).toEqual({status:'undefined'});
  expect(()=>qiblaBearing(NaN,0)).toThrow('LOCATION_INVALID');expect(()=>qiblaBearing(91,0)).toThrow('LOCATION_INVALID');
});
it('resumes only bounded valid on-device locations and discards unexpected fields',()=>{
  const location={id:'test',name:'Home',latitude:51.5,longitude:-.1};
  expect(restoreLocations(JSON.stringify({version:1,locations:[{...location,extra:'discard'}]}))).toEqual([location]);
  for(const data of [{version:2,locations:[]},{version:1,locations:[{...location,latitude:'51.5'}]},{version:1,locations:[location,location]},{version:1,locations:Array(9).fill(location)},{version:1,locations:[{...location,name:''}]}])expect(restoreLocations(JSON.stringify(data))).toBeNull();
  expect(restoreLocations('not JSON')).toBeNull();
});

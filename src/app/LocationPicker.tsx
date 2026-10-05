'use client';
import {useEffect,useState} from 'react';
import {LOCATION_PRESETS,restoreLocations,validCoordinates,type SavedLocation} from '@/lib/location-tools';
const STORAGE='isnadlens-saved-locations-v1';
type Selection={latitude:number;longitude:number;timezone?:string;method?:number};
export function LocationPicker({ar,latitude,longitude,onPick}:{ar:boolean;latitude:string;longitude:string;onPick:(location:Selection)=>void}){
  const [saved,setSaved]=useState<SavedLocation[]>([]);const [name,setName]=useState('');const [notice,setNotice]=useState('');
  useEffect(()=>{try{const value=localStorage.getItem(STORAGE);if(value){const restored=restoreLocations(value);if(restored)setSaved(restored);else setNotice('storage');}}catch{setNotice('storage');}},[]);
  const preset=LOCATION_PRESETS.find(location=>Number(latitude)===location.latitude&&Number(longitude)===location.longitude);
  function persist(locations:SavedLocation[]){try{localStorage.setItem(STORAGE,JSON.stringify({version:1,locations}));setSaved(locations);setNotice('');}catch{setNotice('storage');}}
  function save(){
    if(!name.trim()||name.length>60||!latitude.trim()||!longitude.trim()||!validCoordinates(Number(latitude),Number(longitude))){setNotice('invalid');return;}
    if(saved.length>=8){setNotice('full');return;}
    persist([...saved,{id:typeof crypto.randomUUID==='function'?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,name:name.trim(),latitude:Number(latitude),longitude:Number(longitude)}]);setName('');
  }
  return <div>
    <label>{ar?'اختر مدينة':'Choose a city'}<select value={preset?.id??''} onChange={event=>{const choice=LOCATION_PRESETS.find(location=>location.id===event.target.value);if(choice)onPick(choice);}}><option value="">{ar?'إحداثيات مخصصة':'Custom coordinates'}</option>{LOCATION_PRESETS.map(location=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
    <p>{ar?'مركز المدينة تقريبي. اختر طريقة الحساب المناسبة لجدول مسجدك.':'City centres are approximate. Choose the calculation method appropriate to your mosque timetable.'}</p>
    <details><summary>{ar?'مواقعي المحفوظة على هذا الجهاز':'My locations saved on this device'}</summary>
      <label>{ar?'اسم الموقع':'Location name'}<input maxLength={60} value={name} onChange={event=>setName(event.target.value)}/></label><button type="button" onClick={save}>{ar?'احفظ الموقع الحالي':'Save current location'}</button>
      {saved.map(location=><div key={location.id}><button type="button" onClick={()=>onPick(location)}>{location.name}</button> <button type="button" aria-label={`${ar?'احذف':'Delete'} ${location.name}`} onClick={()=>persist(saved.filter(item=>item.id!==location.id))}>{ar?'حذف':'Delete'}</button></div>)}
      <p>{ar?'الحفظ باختيارك في هذا المتصفح فقط؛ لا يزامَن بحساب.':'Saving is optional and stays in this browser; it does not sync to an account.'}</p>
    </details>
    {notice&&<p role="status">{notice==='full'?(ar?'يمكن حفظ ثمانية مواقع. احذف موقعاً لإضافة آخر.':'Eight locations can be saved. Delete one to add another.'):notice==='invalid'?(ar?'اكتب اسماً وإحداثيات صالحة.':'Enter a name and valid coordinates.'):(ar?'تعذر قراءة المواقع أو حفظها؛ يبقى الإدخال اليدوي متاحاً.':'Locations could not be read or saved; manual entry remains available.')}</p>}
  </div>;
}

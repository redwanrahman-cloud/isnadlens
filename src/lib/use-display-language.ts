'use client';
import {useCallback,useEffect,useState} from 'react';
import {displayLanguages,type DisplayLanguage} from './display-copy';

export const displayLanguageStorageKey='isnadlens:display-language:v1';
const changed='isnadlens:display-language-changed';
let sessionLanguage:DisplayLanguage='ar';
function valid(value:unknown):value is DisplayLanguage{return typeof value==='string'&&displayLanguages.includes(value as DisplayLanguage);}
function apply(language:DisplayLanguage){document.documentElement.lang=language;document.documentElement.dir=language==='ar'||language==='ur'?'rtl':'ltr';}

/** Explicit choices survive full page navigation; unavailable storage never blocks the app. */
export function useDisplayLanguage():[DisplayLanguage,(language:DisplayLanguage)=>void]{
 const [language,setLanguage]=useState<DisplayLanguage>('ar');
 useEffect(()=>{
  let saved:unknown=sessionLanguage;
  try{saved=localStorage.getItem(displayLanguageStorageKey)||sessionLanguage;}catch{}
  const initial=valid(saved)?saved:sessionLanguage;
  sessionLanguage=initial;setLanguage(initial);apply(initial);
  const update=(event:Event)=>{if(event instanceof StorageEvent&&event.key!==displayLanguageStorageKey)return;const value=event instanceof StorageEvent?event.newValue:(event as CustomEvent).detail;if(valid(value)){sessionLanguage=value;setLanguage(value);apply(value);}};
  window.addEventListener(changed,update);window.addEventListener('storage',update);
  return()=>{window.removeEventListener(changed,update);window.removeEventListener('storage',update);};
 },[]);
 const select=useCallback((value:DisplayLanguage)=>{
  if(!valid(value))return;
  sessionLanguage=value;setLanguage(value);apply(value);
  try{localStorage.setItem(displayLanguageStorageKey,value);}catch{}
  window.dispatchEvent(new CustomEvent(changed,{detail:value}));
 },[]);
 return[language,select];
}

'use client';

import {useEffect, useState} from 'react';
import {displayLanguages, displayLanguageMetadata, passageVoiceCopy, type DisplayLanguage} from '@/lib/display-copy';
import {SpeechPlayer} from './SpeechPlayer';
type OriginalPassage = {source_id:string; locator:string; source_language?:string; quotation_sha256:string};
type TranslatedPassage = {quotation:string; quotation_sha256:string; source_language?:string; version:string; source_url:string; attribution:string; publisher_notice?:string; publisher_fields?:Record<string,string|null>; integrity:{passed:boolean}};
export function PassageTranslation({item,language}:{item:OriginalPassage;language:DisplayLanguage}) {
  const [target,setTarget]=useState<DisplayLanguage>(language==='ar'?'en':language);
  const [translation,setTranslation]=useState<TranslatedPassage|null>(null);
  const [state,setState]=useState<'loading'|'ready'|'unavailable'>('loading');
  const copy=passageVoiceCopy[language];
  useEffect(()=>setTarget(language==='ar'?'en':language),[language]);
  useEffect(()=>{
    const controller=new AbortController(); setTranslation(null); setState('loading');
    const hadith=item.source_id.startsWith('HADEETHENC-');
    const params=new URLSearchParams({corpus:hadith?'hadith':'quran',targetLanguage:target,sourceLanguage:item.source_language||'ar',expectedOriginalHash:item.quotation_sha256});
    if(hadith)params.set('recordId',item.locator.split(':')[1]);else params.set('locator',item.locator);
    fetch(`/api/passage-translations?${params}`,{signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error('unavailable');return response.json();})
      .then(data=>{
        if(controller.signal.aborted)return;
        if(data.status!=='available'||data.target_language!==target||data.source_record?.quotation_sha256!==item.quotation_sha256||!data.translated_record?.integrity?.passed||typeof data.translated_record.quotation!=='string')throw new Error('translation_identity_mismatch');
        setTranslation(data.translated_record);setState('ready');
      }).catch(()=>{if(!controller.signal.aborted)setState('unavailable');});
    return()=>controller.abort();
  },[item.source_id,item.locator,item.source_language,item.quotation_sha256,target]);
  return <section className="passage-translation">
    <h4>{copy.publishedTranslation}</h4>
    <label>{copy.translationLanguage} <select value={target} onChange={event=>setTarget(event.target.value as DisplayLanguage)}>{displayLanguages.filter(code=>code!=='ar').map(code=><option key={code} value={code}>{displayLanguageMetadata[code].nativeName}</option>)}</select></label>
    {state==='loading'&&<p role="status">{copy.loadingPassage}</p>}
    {state==='unavailable'&&<p role="status">{copy.unavailablePassage}</p>}
    {state==='unavailable'&&target==='bn'&&!item.source_id.startsWith('HADEETHENC-')&&/^\d{1,3}:\d{1,3}$/.test(item.locator)&&<a href={`https://quranenc.com/en/browse/bengali_zakaria/${item.locator.replace(':','/')}`} target="_blank" rel="noopener noreferrer">{copy.openTranslationSource} · বাংলা ↗</a>}
    {translation&&<>
      <blockquote lang={target} dir={target==='ur'?'rtl':'ltr'}>{translation.quotation}</blockquote>
      <SpeechPlayer text={translation.quotation} spokenLanguage={target} language={language}/>
      <p>{translation.attribution} · <bdi>{translation.version}</bdi></p>
      <a href={translation.source_url} target="_blank" rel="noopener noreferrer">{copy.openTranslationSource} ↗</a>
      {translation.publisher_fields?.footnotes&&<details><summary>{copy.publisherFootnotes}</summary><p lang={target} dir={target==='ur'?'rtl':'ltr'}>{translation.publisher_fields.footnotes}</p></details>}
      <details><summary>{copy.editionNotice}</summary><p lang={target} dir={target==='ur'?'rtl':'ltr'}>{translation.publisher_fields?.description}</p><p style={{whiteSpace:'pre-wrap'}}>{translation.publisher_notice}</p><code dir="ltr" style={{overflowWrap:'anywhere'}}>SHA-256 {translation.quotation_sha256}</code></details>
    </>}
  </section>;
}

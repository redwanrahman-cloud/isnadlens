import {describe,expect,it} from 'vitest';
import {displayCopy,displayLanguages,displayLanguageMetadata,displayNotices,statusCopy,sourceIdentificationCopy,sourceIdentificationMethodCopy,passageVoiceCopy,isClaimInputLanguage} from '../src/lib/display-copy';

describe('display language boundaries',()=>{
  it('offers nine display languages while permitting only Arabic and English claim input',()=>{
    expect(displayLanguages).toEqual(['ar','en','bn','hi','ur','id','es','fr','de']);
    expect(displayLanguages.filter(isClaimInputLanguage)).toEqual(['ar','en']);
  });
  it.each(displayLanguages)('has complete draft interface copy and explicit review status for %s',language=>{
    expect(Object.keys(displayCopy[language]).sort()).toEqual(Object.keys(displayCopy.en).sort());
    for(const value of Object.values(displayCopy[language]))expect(Array.isArray(value)?value.every(item=>item.trim()):value.trim()).toBeTruthy();
    expect(displayLanguageMetadata[language].reviewStatus).toBe('not_independently_reviewed');
    expect(displayLanguageMetadata[language].draft).toBe(true);
    expect(displayLanguageMetadata[language].direction).toBe(['ar','ur'].includes(language)?'rtl':'ltr');
    for(const dictionary of [displayNotices,statusCopy,sourceIdentificationCopy,sourceIdentificationMethodCopy,passageVoiceCopy]){
      for(const value of Object.values(dictionary[language]))expect(value.trim()).toBeTruthy();
    }
  });
});

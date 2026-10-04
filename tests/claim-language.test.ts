import {describe,expect,it} from 'vitest';
import {CLAIM_LANGUAGES,fastScriptHint,isClaimLanguage,isClaimInputSelection} from '../src/lib/claim-language';

describe('nine-language intake hints',()=>{
  it('supports nine manual languages and automatic mode',()=>{
    expect(CLAIM_LANGUAGES).toEqual(['ar','en','bn','hi','ur','id','es','fr','de']);
    for(const language of CLAIM_LANGUAGES)expect(isClaimInputSelection(language)).toBe(true);
    expect(isClaimInputSelection('auto')).toBe(true);
    expect(isClaimLanguage('auto')).toBe(false);
    expect(isClaimInputSelection('ja')).toBe(false);
  });
  it.each(['pig eating is haram','Manger du porc est interdit.','Comer cerdo está prohibido.','Schweinefleisch ist verboten.','Makan babi haram.'])('does not pretend Latin-script language identification for %s',claim=>{
    expect(fastScriptHint(claim)).toEqual({language:null,script:'latin',confidence:'ambiguous'});
  });
  it('provides script hints for Bengali and Hindi without altering original text',()=>{
    const claim='  শূকরের মাংস খাওয়া হারাম।  ';
    expect(fastScriptHint(claim)).toEqual({language:'bn',script:'bengali',confidence:'script_hint'});
    expect(claim).toBe('  শূকরের মাংস খাওয়া হারাম।  ');
    expect(fastScriptHint('सूअर का मांस खाना हराम है।')).toEqual({language:'hi',script:'devanagari',confidence:'script_hint'});
  });
  it('keeps shared Arabic script ambiguous but provides an Urdu-letter hint',()=>{
    expect(fastScriptHint('أكل لحم الخنزير حرام')).toEqual({language:null,script:'arabic',confidence:'ambiguous'});
    expect(fastScriptHint('سور کا گوشت کھانا حرام ہے۔')).toEqual({language:'ur',script:'arabic',confidence:'script_hint'});
  });
  it.each(['هل pork حرام؟','English বাংলা'])('keeps mixed text ambiguous: %s',claim=>{
    expect(fastScriptHint(claim)).toEqual({language:null,script:'mixed',confidence:'ambiguous'});
  });
  it.each(['','2:173','日本語'])('returns no language for empty or unsupported text: %s',claim=>{
    expect(fastScriptHint(claim)).toEqual({language:null,script:'unknown',confidence:'ambiguous'});
  });
});

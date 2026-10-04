import {describe,expect,it} from 'vitest';
import {inferClaimInputLanguage} from '../src/lib/claim-language';

describe('claim script routing without rewriting',()=>{
  it('routes ordinary English claims despite a stale Arabic selection',()=>{
    expect(inferClaimInputLanguage('pig eating is haram','ar')).toBe('en');
    expect(inferClaimInputLanguage('Is eating pork forbidden? 2:173','ar')).toBe('en');
  });
  it('routes Arabic text despite English selection without changing punctuation or source text',()=>{
    const claim='هل أكل لحم الخنزير حرام؟ «حُرِّمَتْ» 2:173';
    expect(inferClaimInputLanguage(claim,'en')).toBe('ar');
    expect(claim).toBe('هل أكل لحم الخنزير حرام؟ «حُرِّمَتْ» 2:173');
  });
  it.each(['هل pork حرام؟','2:173','', 'হাদিসটি কী বলে؟','यह दावा है','English বাংলা'])('keeps explicit selection for mixed, unsupported or nonletter text: %s',claim=>{
    expect(inferClaimInputLanguage(claim,'ar')).toBe('ar');
    expect(inferClaimInputLanguage(claim,'en')).toBe('en');
  });
  it('does not claim to identify or translate other Latin-script languages',()=>{
    expect(inferClaimInputLanguage('¿Es esto correcto?','ar')).toBe('en');
    // English routing does not imply Spanish claim-input support or translation.
  });
});

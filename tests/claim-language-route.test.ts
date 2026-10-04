import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({verify:vi.fn()}));
vi.mock('@/lib/multilingual-intake',()=>({verifyMultilingualClaim:mocks.verify}));
vi.mock('@/lib/claim-language',async()=>import('../src/lib/claim-language'));
import {POST} from '../src/app/api/verify/route';
import {CLAIM_LANGUAGES,type ClaimInputSelection} from '../src/lib/claim-language';
let client=0;
beforeEach(()=>{vi.clearAllMocks();mocks.verify.mockImplementation(async input=>input);});
function request(claim:string,inputLanguage:string,corpusSelection?:'auto'|'quran'|'hadith'){
  return new NextRequest('http://localhost/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`test-language-${++client}`},body:JSON.stringify({claim,inputLanguage,...(corpusSelection?{corpusSelection}:{})})});
}
describe('API multilingual intake boundary',()=>{
  it('never forwards a caller-supplied scope admission or gloss',async()=>{
    const req=new NextRequest('http://localhost/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`test-language-${++client}`},body:JSON.stringify({claim:'Develop an application',inputLanguage:'auto',admittedTextual:true,scopeClaim:'The Quran prescribes prayer'})});
    expect((await POST(req)).status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith({claim:'Develop an application',inputLanguage:'auto',corpusSelection:'auto'});
  });
  it('delegates auto-detection without rewriting the original claim',async()=>{
    const claim='  pig eating is haram?  ';
    expect((await POST(request(claim,'auto'))).status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith({claim,inputLanguage:'auto',corpusSelection:'auto'});
  });
  it.each(CLAIM_LANGUAGES)('passes explicit %s input and selected source to the intake wrapper',async inputLanguage=>{
    const claim='Original wording stays unchanged.';
    expect((await POST(request(claim,inputLanguage,'quran'))).status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith({claim,inputLanguage,corpusSelection:'quran'});
  });
  it('rejects unsupported input-language values before verification',async()=>{
    expect((await POST(request('Original claim','ja','hadith'))).status).toBe(400);
    expect(mocks.verify).not.toHaveBeenCalled();
  });
});

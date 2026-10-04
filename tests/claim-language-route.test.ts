import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({verify:vi.fn(),auto:vi.fn()}));
vi.mock('@/lib/verification',()=>({verifyClaim:mocks.verify}));
vi.mock('@/lib/auto-verification',()=>({verifyAutoClaim:mocks.auto}));
vi.mock('@/lib/claim-language',async()=>import('../src/lib/claim-language'));
import {POST} from '../src/app/api/verify/route';
let client=0;
beforeEach(()=>{vi.clearAllMocks();mocks.verify.mockImplementation(async input=>input);mocks.auto.mockImplementation(async input=>input);});
function request(claim:string,inputLanguage:'ar'|'en',corpusSelection:'auto'|'quran'|'hadith'){
  return new NextRequest('http://localhost/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`test-language-${++client}`},body:JSON.stringify({claim,inputLanguage,corpusSelection})});
}
describe('API script-based claim-language boundary',()=>{
  it('corrects a stale Arabic selection for natural English without rewriting the claim',async()=>{
    const claim='  pig eating is haram?  ';
    const response=await POST(request(claim,'ar','auto'));
    expect(response.status).toBe(200);
    expect(mocks.auto).toHaveBeenCalledWith({claim,inputLanguage:'en'});
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it('corrects Arabic claim input in manual Quran mode',async()=>{
    const claim='أكل لحم الخنزير حرام؟';
    await POST(request(claim,'en','quran'));
    expect(mocks.verify).toHaveBeenCalledWith({claim,inputLanguage:'ar',corpusSelection:'quran',useQueryPlanner:true});
  });
  it('retains the explicit selection for mixed-script claims',async()=>{
    const claim='هل eating pork حرام؟';
    await POST(request(claim,'ar','hadith'));
    expect(mocks.verify).toHaveBeenCalledWith({claim,inputLanguage:'ar',corpusSelection:'hadith',useQueryPlanner:true});
  });
});

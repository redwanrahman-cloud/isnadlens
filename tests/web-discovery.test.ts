import {afterEach,expect,it,vi} from 'vitest';
import {trustedUrl,searchReferences,discoverWebReferences,clearWebDiscoveryCache,foldedSource,authenticateQuranReference} from '../src/lib/web-discovery';
import {loadCorpus} from '../src/lib/corpus';
import {reserveSpend,settleSpend} from '../src/lib/budget';
vi.mock('../src/lib/budget',()=>({reserveSpend:vi.fn(()=> 'web-reservation'),settleSpend:vi.fn(()=>.012)}));
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();clearWebDiscoveryCache();});
it.each(['fa','as'])('authenticates exact verse pages independently of publisher UI locale: %s',async locale=>{
 const verse=loadCorpus().verses.find(v=>v.id==='24:15')!;
 const fetcher=vi.fn().mockResolvedValue(Response.json({result:{sura:'24',aya:'15',arabic_text:verse.display}}));vi.stubGlobal('fetch',fetcher);
 expect(await authenticateQuranReference('24:15',`https://quranenc.com/${locale}/browse/urdu_junagarhi/24/15`)).toBe(true);
 expect(await authenticateQuranReference('24:16',`https://quranenc.com/${locale}/browse/urdu_junagarhi/24/15`)).toBe(false);
 expect(fetcher).toHaveBeenCalledOnce();
});
it('rejects redirects to arbitrary hosts, credentials, ports and lookalike domains',()=>{
 for(const u of ['http://quranenc.com/en','https://quranenc.com.evil.test/','https://quranenc.com:8443/','https://user@quranenc.com/','https://127.0.0.1/','https://evil.quranenc.com/'])expect(trustedUrl(u)).toBeNull();
 expect(trustedUrl('https://quranenc.com/en/browse/english_rwwad/2')).not.toBeNull();
 expect(searchReferences([{content:[{annotations:[{type:'url_citation',url:'https://evil.test/'},{type:'url_citation',url:'https://alifta.gov.sa/en/example',title:'Attributed ruling'}]}]}])).toHaveLength(1);
});
it('compares Quran display orthography only for discovery and rejects a locator from another cited verse',async()=>{
 expect(foldedSource('وَإِيتَآئِ ذِى')).toBe(foldedSource('وَإِيتَآيِ ذِي'));
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 expect(await authenticateQuranReference('16:91','https://quranenc.com/en/browse/english_saheeh/16/90')).toBe(false);expect(fetcher).not.toHaveBeenCalled();
});
it('does not search for private rulings or unrelated questions',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 const r=await discoverWebReferences('What is the weather tomorrow?');expect(r.reason).toBe('WEB_SCOPE_REFERRAL');expect(fetcher).not.toHaveBeenCalled();expect(reserveSpend).not.toHaveBeenCalled();
});
it('opens publisher pages and verifies discovered Quran locators without importing generated quotations',async()=>{
 const verse=loadCorpus().verses.find(v=>v.id==='2:173')!;
 const fetcher=vi.fn().mockResolvedValueOnce(Response.json({status:'completed',usage:{input_tokens:300,output_tokens:100},output:[{type:'web_search_call',action:{type:'search'}},{type:'message',content:[{type:'output_text',text:'Quran 2:173',annotations:[{type:'url_citation',url:'https://quranenc.com/en/browse/english_rwwad/2',title:'Al-Baqarah'}]}]}]})).mockResolvedValueOnce(new Response('<html>publisher page</html>',{headers:{'Content-Type':'text/html'}})).mockResolvedValueOnce(Response.json({result:{sura:'2',aya:'173',arabic_text:verse.display}}));
 vi.stubGlobal('fetch',fetcher);const r=await discoverWebReferences('Does the Quran forbid pork?','Does the Quran forbid pork?','quran');
 expect(r.quran_locators).toEqual(['2:173']);expect(r.pages[0].status).toBe('opened');expect(r.search_calls).toBe(1);expect(r.usage?.estimated_cost_usd).toBe(.012);
 const request=JSON.parse(fetcher.mock.calls[0][1].body);expect(request.max_tool_calls).toBe(3);expect(request.tools[0].filters.allowed_domains).toHaveLength(3);expect(reserveSpend).toHaveBeenCalledWith(expect.any(String),expect.any(String),2400,undefined,{maximumCalls:3,inputTokenBound:128000});expect(settleSpend).toHaveBeenCalledWith('web-reservation',{input_tokens:300,output_tokens:100},undefined,1);
 const again=await discoverWebReferences('Does the Quran forbid pork?','Does the Quran forbid pork?','quran');expect(again.cached).toBe(true);expect(again.usage).toBeNull();expect(again.search_calls).toBe(0);expect(fetcher).toHaveBeenCalledTimes(3);
});
it('does not authenticate a fabricated or changed online passage',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(Response.json({status:'completed',usage:{input_tokens:300,output_tokens:100},output:[{type:'web_search_call',action:{type:'search'}},{content:[{type:'output_text',text:'Quran 2:173',annotations:[{type:'url_citation',url:'https://quranenc.com/en/browse/english_rwwad/2'}]}]}]})).mockResolvedValueOnce(new Response('page',{headers:{'Content-Type':'text/html'}})).mockResolvedValueOnce(Response.json({result:{sura:'2',aya:'173',arabic_text:'invented'}})));
 const r=await discoverWebReferences('Does the Quran forbid pork?');expect(r.quran_locators).toEqual([]);expect(r.reason).toBe('NO_ADMITTED_REFERENCE_DISCOVERED');
});

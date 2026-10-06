import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {authorizedBudget,reserveSpend,settleSpend,testCallLimitReached} from '../src/lib/budget';
import {planClaimQueries} from '../src/lib/query-planner';

let directory:string;
beforeEach(()=>{
 directory=mkdtempSync(join(tmpdir(),'isnadlens-credit-mode-'));
 vi.stubEnv('ISNADLENS_PRIVATE_DIR',directory);
 vi.stubEnv('ISNADLENS_REQUIRE_EXISTING_LEDGER','true');
 vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED','true');
 vi.stubEnv('ISNADLENS_PROVIDER_CREDIT_ONLY','true');
 vi.stubEnv('ISNADLENS_MAX_SPEND_USD','0');
 vi.stubEnv('ISNADLENS_MAX_CALLS','0');
 vi.stubEnv('OPENAI_API_KEY','offline-fixture');
 vi.stubEnv('OPENAI_MODEL','gpt-5.4-mini');
 writeFileSync(join(directory,'api-spend.json'),JSON.stringify({version:1,entries:[]}));
 vi.stubGlobal('fetch',vi.fn(()=>{throw new Error('Unexpected network call');}));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();rmSync(directory,{recursive:true,force:true});});

it('keeps old accounting and records new usage after the development allowance is exhausted',()=>{
 const old={id:'old-unsettled',model:'gpt-5.4-mini',reserved_usd:100,actual_usd:null,status:'reserved',created_at:'2026-10-06T00:00:00Z',input_tokens:null,output_tokens:null};
 writeFileSync(join(directory,'api-spend.json'),JSON.stringify({version:1,entries:[old]}));
 const id=reserveSpend('gpt-5.4-mini','{}',100);
 settleSpend(id,{input_tokens:50,output_tokens:20});
 const ledger=JSON.parse(readFileSync(join(directory,'api-spend.json'),'utf8'));
 expect(ledger.entries[0]).toEqual(old);
 expect(ledger.entries[1]).toMatchObject({id,status:'settled',input_tokens:50,output_tokens:20});
 expect(ledger.entries[1].actual_usd).toBeGreaterThan(0);
 expect(testCallLimitReached(1000000)).toBe(false);
 expect(fetch).not.toHaveBeenCalled();
});
it('still requires explicit authorization for paid calls',()=>{
 vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED','false');
 expect(authorizedBudget()).toBe(0);
 expect(()=>reserveSpend('gpt-5.4-mini','{}',100)).toThrow('SPEND_BUDGET_UNAUTHORIZED');
 expect(testCallLimitReached(0)).toBe(true);
});
it('keeps finite test caps as the default and requires exact opt-in',()=>{
 vi.stubEnv('ISNADLENS_PROVIDER_CREDIT_ONLY','TRUE');
 vi.stubEnv('ISNADLENS_MAX_SPEND_USD','0.000001');
 vi.stubEnv('ISNADLENS_MAX_CALLS','20');
 expect(()=>reserveSpend('gpt-5.4-mini','{}',100)).toThrow('SPEND_BUDGET_STOP');
 expect(testCallLimitReached(19)).toBe(false);
 expect(testCallLimitReached(20)).toBe(true);
});
it('does not bypass a locked or corrupt spending ledger',()=>{
 writeFileSync(join(directory,'api-spend.lock'),'');
 expect(()=>reserveSpend('gpt-5.4-mini','{}',100)).toThrow('BUDGET_LEDGER_LOCKED');
 rmSync(join(directory,'api-spend.lock'));
 writeFileSync(join(directory,'api-spend.json'),'{}');
 expect(()=>reserveSpend('gpt-5.4-mini','{}',100)).toThrow('BUDGET_LEDGER_INVALID');
});
it('does not initialize a missing production ledger',()=>{
 rmSync(join(directory,'api-spend.json'));
 expect(()=>reserveSpend('gpt-5.4-mini','{}',100)).toThrow('BUDGET_LEDGER_INVALID');
});
it('allows planning past the test cap while preserving the two-request concurrency guard',async()=>{
 const pending:Array<(value:Response)=>void>=[];
 const fetchMock=vi.fn(()=>new Promise<Response>(resolve=>pending.push(resolve)));
 vi.stubGlobal('fetch',fetchMock);
 const request={claim:'What does the Quran say about fasting?',inputLanguage:'en' as const,admittedTextual:true};
 const first=planClaimQueries(request),second=planClaimQueries(request);
 await expect(planClaimQueries(request)).rejects.toThrow('QUERY_PLAN_CALL_OR_CONCURRENCY_STOP');
 expect(fetchMock).toHaveBeenCalledTimes(2);
 for(const resolve of pending)resolve(new Response(JSON.stringify({status:'completed',usage:{input_tokens:50,output_tokens:20},output:[{content:[{type:'output_text',text:JSON.stringify({arabic_terms:['الصيام'],english_terms:['fasting']})}]}]})));
 await expect(first).resolves.toHaveProperty('english_terms',['fasting']);
 await expect(second).resolves.toHaveProperty('english_terms',['fasting']);
 expect(JSON.parse(readFileSync(join(directory,'api-spend.json'),'utf8')).entries.every((e:{status:string})=>e.status==='settled')).toBe(true);
});

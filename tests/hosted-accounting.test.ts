import {afterEach,expect,it,vi} from 'vitest';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reserveSpend,settleSpend} from '../src/lib/budget';
import {reserveFreeRequest} from '../src/lib/cloud-speech';
const temporary:string[]=[];
afterEach(()=>{vi.unstubAllEnvs();for(const path of temporary.splice(0))rmSync(path,{recursive:true,force:true});});
function setup(){const directory=mkdtempSync(join(tmpdir(),'isnadlens-hosted-'));temporary.push(directory);vi.stubEnv('ISNADLENS_PRIVATE_DIR',directory);vi.stubEnv('ISNADLENS_REQUIRE_EXISTING_LEDGER','true');vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED','true');vi.stubEnv('ISNADLENS_MAX_SPEND_USD','1');return directory;}
it('does not silently create a new paid allowance when production storage disappears',()=>{
 const directory=setup();expect(()=>reserveSpend('gpt-5.6-luna','{}',100)).toThrow('BUDGET_LEDGER_INVALID');
 expect(existsSync(join(directory,'api-spend.json'))).toBe(false);
 expect(existsSync(join(directory,'api-spend.lock'))).toBe(false);
});
it('retains existing production reservations and refuses corrupt or abandoned accounting',()=>{
 const directory=setup();const path=join(directory,'api-spend.json');writeFileSync(path,JSON.stringify({version:1,entries:[]}));
 const id=reserveSpend('gpt-5.6-luna','{}',100);settleSpend(id,{input_tokens:50,output_tokens:20});
 expect(JSON.parse(readFileSync(path,'utf8')).entries[0].id).toBe(id);
 writeFileSync(join(directory,'api-spend.lock'),'');expect(()=>reserveSpend('gpt-5.6-luna','{}',100)).toThrow('BUDGET_LEDGER_LOCKED');
});
it('does not reset the shared Google quota when production storage is missing or malformed',()=>{
 const directory=setup();expect(()=>reserveFreeRequest()).toThrow('SPEECH_QUOTA_INVALID');
 const path=join(directory,'speech','quota.json');expect(existsSync(path)).toBe(false);
 writeFileSync(path,'{}');expect(()=>reserveFreeRequest()).toThrow('SPEECH_QUOTA_INVALID');
});

import {afterEach,expect,it,vi} from 'vitest';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {privateDirectory} from '../src/lib/private-directory';
import {reserveSpend,settleSpend} from '../src/lib/budget';
const temporary:string[]=[];
afterEach(()=>{vi.unstubAllEnvs();for(const path of temporary.splice(0))rmSync(path,{recursive:true,force:true});});
it('uses one existing ledger across configured worktrees and retains its reservations',()=>{
 const directory=mkdtempSync(join(tmpdir(),'isnadlens-shared-'));temporary.push(directory);
 vi.stubEnv('ISNADLENS_PRIVATE_DIR',directory);
 vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED','true');vi.stubEnv('ISNADLENS_MAX_SPEND_USD','0.03');
 const first=reserveSpend('gpt-5.4-mini','{}',3500,directory);
 expect(privateDirectory()).toBe(directory);
 // A second worktree omits the explicit directory and must still see this reservation.
 expect(()=>reserveSpend('gpt-5.4-mini','{}',3500)).toThrow('SPEND_BUDGET_STOP');
 settleSpend(first,{input_tokens:100,output_tokens:50});
 const ledger=JSON.parse(readFileSync(join(directory,'api-spend.json'),'utf8'));
 expect(ledger.entries).toHaveLength(1);expect(ledger.entries[0].status).toBe('settled');
 expect(ledger.entries[0].id).toBe(first);
});
it('rejects a relative shared accounting path instead of creating a fresh ledger',()=>{
 vi.stubEnv('ISNADLENS_PRIVATE_DIR','another-ledger');
 expect(()=>privateDirectory()).toThrow('PRIVATE_DIRECTORY_MUST_BE_ABSOLUTE');
});

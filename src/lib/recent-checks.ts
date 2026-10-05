import {z} from 'zod';
import {CLAIM_LANGUAGES} from './claim-language';
export const MAX_RECENT_CHECKS=8;
export const MAX_RECENT_BYTES=600_000;
export const savedCheckSchema=z.object({record_id:z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),claim:z.string().min(1).max(1200),created_at:z.string().datetime(),input_language:z.enum([...CLAIM_LANGUAGES,'auto']),corpus_selection:z.enum(['auto','quran','hadith']),receipt:z.string().min(1).max(100_000)}).strict();
export type SavedCheck=z.infer<typeof savedCheckSchema>;
export function restoreChecks(raw:string|null):SavedCheck[]{
 if(raw===null)return [];
 if(new TextEncoder().encode(raw).length>MAX_RECENT_BYTES)throw new Error('RECENT_STORAGE_INVALID');
 try{const data=z.object({version:z.literal(1),checks:z.array(savedCheckSchema).max(MAX_RECENT_CHECKS)}).strict().parse(JSON.parse(raw));if(new Set(data.checks.map(item=>item.record_id)).size!==data.checks.length)throw new Error('duplicate');return data.checks;}catch{throw new Error('RECENT_STORAGE_INVALID');}
}
export function insertCheck(previous:SavedCheck[],value:SavedCheck):SavedCheck[]{
 const check=savedCheckSchema.parse(value);let checks=[check,...previous.filter(item=>item.record_id!==check.record_id)].slice(0,MAX_RECENT_CHECKS);
 while(checks.length>1&&new TextEncoder().encode(JSON.stringify({version:1,checks})).length>MAX_RECENT_BYTES)checks=checks.slice(0,-1);
 return checks;
}
export function encodeChecks(checks:SavedCheck[]){const raw=JSON.stringify({version:1,checks});restoreChecks(raw);return raw;}

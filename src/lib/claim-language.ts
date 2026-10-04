export const CLAIM_LANGUAGES = ['ar','en','bn','hi','ur','id','es','fr','de'] as const;
export type ClaimLanguage = typeof CLAIM_LANGUAGES[number];
export type ClaimInputSelection = ClaimLanguage | 'auto';
export type ScriptHint = {language:ClaimLanguage|null;script:'arabic'|'latin'|'bengali'|'devanagari'|'mixed'|'unknown';confidence:'script_hint'|'ambiguous'};
export function isClaimLanguage(value:unknown):value is ClaimLanguage {return typeof value==='string'&&(CLAIM_LANGUAGES as readonly string[]).includes(value);}
export function isClaimInputSelection(value:unknown):value is ClaimInputSelection {return value==='auto'||isClaimLanguage(value);}
/** Fast hints, not language authentication. Never rewrites/translates text.
 * Shared Latin/Arabic scripts require detection or an explicit user choice.
 * Distinctive Urdu letters remain a hint because other languages share them.
 */
export function fastScriptHint(claim:string):ScriptHint {
  const letters=[...claim].filter(character=>/\p{Letter}/u.test(character));
  if(!letters.length)return {language:null,script:'unknown',confidence:'ambiguous'};
  const scripts=new Set(letters.map(character=>/\p{Script=Bengali}/u.test(character)?'bengali':/\p{Script=Devanagari}/u.test(character)?'devanagari':/\p{Script=Arabic}/u.test(character)?'arabic':/\p{Script=Latin}/u.test(character)?'latin':'unknown'));
  if(scripts.size!==1)return {language:null,script:'mixed',confidence:'ambiguous'};
  const script=[...scripts][0] as ScriptHint['script'];
  if(script==='bengali')return {language:'bn',script,confidence:'script_hint'};
  if(script==='devanagari')return {language:'hi',script,confidence:'script_hint'};
  if(script==='arabic'&&/[ٹڈڑںھہے]/u.test(claim))return {language:'ur',script,confidence:'script_hint'};
  return {language:null,script,confidence:'ambiguous'};
}

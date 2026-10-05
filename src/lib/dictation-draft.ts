/** Insert dictated text at the saved selection without losing an existing draft. */
export function insertDictation(draft:string,transcript:string,start:number,end:number):string|null {
 const text=transcript.trim();if(!text)return null;
 const from=Math.max(0,Math.min(start,draft.length));
 const to=Math.max(from,Math.min(end,draft.length));
 const before=draft.slice(0,from),after=draft.slice(to);
 const left=before&&!/\s$/.test(before)&&!/^\p{P}/u.test(text)?' ':'';
 const right=after&&!/^\s|^\p{P}/u.test(after)?' ':'';
 const combined=before+left+text+right+after;
 return combined.length<=1200?combined:null;
}

/** Fit long locators/URLs as well as natural-language words inside exported cards. */
export function wrapShareText(value:string,maxWidth:number,measure:(text:string)=>number):string[]{
 const result:string[]=[];
 for(const paragraph of value.split('\n')){
  let line='';
  for(const word of paragraph.split(' ')){
   const next=line?line+' '+word:word;
   if(measure(next)<=maxWidth){line=next;continue;}
   if(line){result.push(line);line='';}
   for(const character of Array.from(word)){
    if(line&&measure(line+character)>maxWidth){result.push(line);line='';}
    line+=character;
   }
  }
  result.push(line);
 }
 return result;
}

// Split only at sentence boundaries: wording and qualifiers are never rewritten.
export function AnswerText({text,language}:{text:string;language:string}){
 const sentences=Array.from(new Intl.Segmenter(language,{granularity:'sentence'}).segment(text),part=>part.segment);
 let count=1;if(sentences.length>1&&sentences[0].trim().length<12)count=2;
 const heading=sentences.slice(0,count).join('');const explanation=sentences.slice(count).join('');
 return <div className="answer-text"><h2>{heading}</h2>{explanation&&<p>{explanation}</p>}</div>;
}

import {expect,it} from 'vitest';
import {wrapShareText} from '../src/lib/share-text';
it('keeps long source URLs inside the card without losing characters',()=>{
 const url='https://quranenc.com/en/browse/english_rwwad/3/159';
 const lines=wrapShareText(url,12,text=>Array.from(text).length);
 expect(lines.every(line=>line.length<=12)).toBe(true);
 expect(lines.join('')).toBe(url);
});
it('preserves paragraphs, Arabic and full Unicode code points',()=>{
 expect(wrapShareText('one two\nthree',7,text=>text.length)).toEqual(['one two','three']);
 const text='نص💚💚';const lines=wrapShareText(text,2,text=>Array.from(text).length);
 expect(lines.join('')).toBe(text);expect(lines.every(line=>!/[\uD800-\uDBFF]$/.test(line))).toBe(true);
});

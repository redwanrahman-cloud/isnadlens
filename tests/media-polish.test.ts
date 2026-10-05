import {describe,it,expect} from 'vitest';
import {recitationUrl} from '../src/lib/quran-recitation';
import {receiptHtml} from '../src/lib/receipt-pdf';
describe('Recorded recitation locator boundaries',()=>{
 it('uses the full-verse recording for a Quran locator only',()=>{expect(recitationUrl('QURAN-AR-TANZIL-UTHMANI-V1.1','3:159')).toBe('https://everyayah.com/data/Alafasy_64kbps/003159.mp3');expect(recitationUrl('HADEETHENC-AR','3:159')).toBeNull();});
 it.each(['0:1','115:1','1:8','3:201','3:0','3:159-160','https://other.test','3:159<script>'])('rejects invalid locator %s',locator=>expect(recitationUrl('QURAN-AR',locator)).toBeNull());
});
describe('PDF receipt text fidelity',()=>{
 it('escapes untrusted text without changing Arabic quotation content',()=>{const html=receiptHtml('IsnadLens — evidence receipt\nAbridged\nRecord: example\n\nOriginal question:\n<script>alert(1)</script>\n\nOriginal source quotation:\nفَتَوَكَّلْ عَلَى اللَّهِ');expect(html).not.toContain('<script>');expect(html).toContain('&lt;script&gt;');expect(html).toContain('فَتَوَكَّلْ عَلَى اللَّهِ');expect(html).toContain('dir="auto"');expect(html).toContain('Evidence receipt');});
});

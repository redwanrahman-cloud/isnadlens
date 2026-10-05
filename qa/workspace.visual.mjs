import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
for(const width of [1440,390])for(const language of ['en','ar'])test(`sample ${width} ${language}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.route('**/api/speech',r=>r.fulfill({json:{available:false}}));
 await page.goto('http://127.0.0.1:3100/');await page.locator('#display-language').selectOption(language);
 const sample=page.locator('.checked-example');await expect(sample.locator('h2')).toHaveText(language==='en'?'No. Trust in Allah goes alongside practical effort.':'لا. التوكل على الله يصاحب الأخذ بالأسباب.');
 if(width===1440&&language==='en'){mkdirSync('output/pdf',{recursive:true});const pending=page.waitForEvent('download');await sample.getByRole('button',{name:'Download PDF receipt',exact:true}).click();await (await pending).saveAs('output/pdf/isnadlens-tawakkul-example.pdf');}
 await expect(sample).toHaveScreenshot(`sample-${width}-${language}.png`,{animations:'disabled',maxDiffPixelRatio:0.001});
});

import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const out='artifacts/private/dashboard-design-2026-10-05';mkdirSync(out,{recursive:true});
const source=JSON.parse(readFileSync('tests/fixtures/dashboard-records.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});const cases=[];
try{for(const width of [1440,768,390,320]){
 const context=await browser.newContext({viewport:{width,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let calls=0;
 await page.route('**/api/verify',r=>{calls++;return r.fulfill({json:source.quran});});
 await page.route('**/api/speech',r=>r.fulfill({json:{available:false}}));
 await page.goto('http://127.0.0.1:3100/');await page.locator('#display-language').selectOption('en');
 await page.screenshot({path:`${out}/empty-${width}.png`,fullPage:true});
 await page.locator('#claim').fill(source.quran.original_claim);await page.getByRole('button',{name:'Examine the evidence',exact:true}).click();await page.locator('.result-content').waitFor();
 await page.getByRole('region',{name:'Evidence map',exact:true}).waitFor();
 if((await page.locator('.evidence-card blockquote').first().textContent())!==source.quran.evidence_items[0].quotation)throw Error('SOURCE_MUTATED');
 if(await page.locator('.verdict h2').textContent()!==source.quran.summary_en)throw Error('SUMMARY_MUTATED');
 const firstTranslation=page.locator('.passage-translation').first();await firstTranslation.locator('select').selectOption('en');await firstTranslation.getByRole('blockquote').waitFor();
 if(!await firstTranslation.getByRole('blockquote').textContent())throw Error('TRANSLATION_EMPTY');
 await page.locator('.verdict .speech-reader>summary').click();await page.locator('.verdict .speech-controls').waitFor();
 await page.getByRole('button',{name:'Create share card',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();await dialog.locator('img').waitFor();
 if(!await dialog.locator('img').getAttribute('src'))throw Error('SHARE_PREVIEW');
 const downloadPromise=page.waitForEvent('download');await dialog.getByRole('button',{name:'Download PNG',exact:true}).click();const file=await downloadPromise;await file.saveAs(`${out}/share-${width}.png`);
 if(!readFileSync(`${out}/share-${width}.png`).subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('INVALID_PNG');
 await page.keyboard.press('Escape');if(await dialog.count())throw Error('DIALOG_ESCAPE');
 await page.screenshot({path:`${out}/quran-${width}.png`,fullPage:true});
 const quranOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.unroute('**/api/verify');await page.route('**/api/verify',r=>{calls++;return r.fulfill({json:source.hadith});});
 await page.locator('#claim').fill(source.hadith.original_claim);await page.getByRole('button',{name:'Examine the evidence',exact:true}).click();await page.locator('.publisher-grade').first().waitFor();
 if(!await page.locator('.publisher-grade').first().textContent())throw Error('PUBLISHER_GRADE_MISSING');
 await page.screenshot({path:`${out}/hadith-${width}.png`,fullPage:true});const hadithOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 // Nine UI languages and both directions must retain the same underlying evidence.
 for(const language of ['ar','en','bn','hi','ur','id','es','fr','de']){await page.route('**/api/translate-result',r=>r.fulfill({status:503,json:{error:'mock unavailable'}}));await page.locator('#display-language').selectOption(language);await page.locator('.input-tabs').waitFor();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`LANGUAGE_OVERFLOW_${width}_${language}`);}
 await page.locator('#display-language').selectOption('ar');await page.screenshot({path:`${out}/arabic-${width}.png`,fullPage:true});
 if(quranOverflow||hadithOverflow||errors.length||calls!==2)throw Error('LAYOUT_OR_BROWSER_FAILURE');cases.push({width,sourceAndSummaryUnchanged:true,publisherGrade:true,publishedTranslation:true,visibleEvidenceMap:true,attachedReader:true,pngExport:true,dialogEscape:true,languages:9,quranOverflow,hadithOverflow,errors});await context.close();
}}finally{await browser.close();}
const report={kind:'dashboard-ui-regression',paidAIcalls:0,providerResponses:'Frozen genuine records replayed, with no new semantic assessment; translation reads admitted local editions.',cases};writeFileSync('artifacts/dashboard-design-2026-10-05.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

import {chromium} from '@playwright/test';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const origin=process.env.ISNADLENS_TEST_ORIGIN||'http://127.0.0.1:3100';
const directory='artifacts/private/site-polish-2026-10-05';mkdirSync(directory,{recursive:true});
const example=JSON.parse(readFileSync('src/lib/checked-example.json','utf8'));
const languages=['ar','en','bn','hi','ur','id','es','fr','de'];
const browser=await chromium.launch({headless:true,channel:'chrome'});
const checks=[];let paidRequests=0;
const assert=(value,message)=>{if(!value)throw new Error(message);};
async function widthCheck(page,label){assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),`Horizontal overflow: ${label}`);}
async function languageCheck(page,language){await page.waitForFunction(code=>document.documentElement.lang===code,language);assert(await page.locator('#display-language').inputValue()===language,`Selector lost ${language}`);assert(await page.locator('html').getAttribute('dir')===(['ar','ur'].includes(language)?'rtl':'ltr'),`Wrong direction: ${language}`);}
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/verify',route=>{paidRequests++;return route.fulfill({status:503,json:{error:'UI_AUDIT_BLOCKS_PAID_CALLS'}});});
  await page.route('**/api/translate-result',route=>{paidRequests++;return route.fulfill({status:503,json:{error:'UI_AUDIT_BLOCKS_PAID_CALLS'}});});
  await page.route('**/api/speech',route=>route.fulfill({json:{available:false}}));
  for(const language of languages){
   await page.goto(origin+'/');await page.locator('#display-language').selectOption(language);await languageCheck(page,language);
   for(const path of ['/pilgrimage','/tools','/']){await page.goto(origin+path);await languageCheck(page,language);await widthCheck(page,`${path} ${language} ${width}`);}
   await page.reload();await languageCheck(page,language);
  }
  await page.locator('#display-language').selectOption('en');
  const sample=page.locator('.checked-example');await sample.waitFor();
  assert(example.evidence.quotation.includes((await sample.locator('.sample-source blockquote').textContent()).trim()),'Sample source quotation changed');
  const readers=sample.locator('.speech-controls > button,.recitation-player > button');assert(await readers.count()>=2,'Attached audio controls missing');
  for(const reader of await readers.all()){
   assert(await reader.locator('svg').count()===1,'Audio icon missing');
   const label=await reader.getAttribute('aria-label')||await reader.textContent();assert(label?.trim(),'Audio control has no accessible name');
   const bounds=await reader.boundingBox();assert(bounds.width>=44&&bounds.height>=44,'Audio touch target too small');
  }
  assert(await sample.locator('.speech-controls select').count()===0,'Voice chooser remains');
  const pdfPromise=page.waitForEvent('download');await sample.getByRole('button',{name:/receipt|PDF/i}).click();const pdf=await pdfPromise;await pdf.saveAs(`${directory}/sample-${width}.pdf`);assert(readFileSync(`${directory}/sample-${width}.pdf`).subarray(0,5).toString()==='%PDF-','Sample receipt is not PDF');
  await sample.getByRole('button',{name:'Create share card',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.locator('img').waitFor();await widthCheck(page,`Share modal ${width}`);
  const pngPromise=page.waitForEvent('download');await dialog.getByRole('button',{name:'Download PNG',exact:true}).click();const png=await pngPromise;await png.saveAs(`${directory}/sample-${width}.png`);assert(readFileSync(`${directory}/sample-${width}.png`).subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Invalid share PNG');await page.keyboard.press('Escape');assert(await dialog.count()===0,'Share Escape dismissal failed');
  await page.screenshot({path:`${directory}/main-${width}.png`,fullPage:true});
  await page.locator('.brand').click();await languageCheck(page,'en');
  await page.goto(origin+'/pilgrimage');await languageCheck(page,'en');
  await page.getByRole('button',{name:'Completed one',exact:true}).first().click();await page.getByText('Recorded: 1 / 7').waitFor();await page.reload();await languageCheck(page,'en');await page.getByText('Recorded: 1 / 7').waitFor();await page.getByRole('button',{name:'Undo',exact:true}).first().click();
  await page.getByRole('button',{name:'Sai · Safa & Marwah',exact:true}).click();await page.getByRole('button',{name:'Put this question in the evidence tool',exact:true}).click();assert((await page.locator('#claim').inputValue()).includes('starting Sai at Safa'),'Journey question handoff failed');
  await page.screenshot({path:`${directory}/pilgrimage-${width}.png`,fullPage:true});
  await page.goto(origin+'/tools');await languageCheck(page,'en');await page.getByLabel('Choose a city').selectOption('london');await page.getByText('119.0°',{exact:true}).waitFor();
  await page.getByText('My locations saved on this device',{exact:true}).click();await page.getByLabel('Location name').fill('Audit office');await page.getByRole('button',{name:'Save current location',exact:true}).click();await page.reload();await languageCheck(page,'en');await page.getByText('My locations saved on this device',{exact:true}).click();await page.getByRole('button',{name:'Audit office',exact:true}).click();await page.getByText('119.0°',{exact:true}).waitFor();
  await page.screenshot({path:`${directory}/tools-${width}.png`,fullPage:true});
  for(const path of ['/method','/sources','/evaluation/latest']){await page.goto(origin+path);await widthCheck(page,`${path} ${width}`);assert(await page.locator('h1').count()>0,`No heading ${path}`);}
  assert(errors.length===0,JSON.stringify(errors));assert(paidRequests===0,'Unexpected automatic AI request');checks.push({width,languages:9,persistenceRoutes:4,reloadPersists:true,samplePdf:true,samplePng:true,accessibleAudioIcons:true,journeyHandoff:true,counterResumeUndo:true,savedLocationResume:true,staticRoutes:3,horizontalOverflow:false,browserErrors:errors});await context.close();
 }
 const context=await browser.newContext();await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage denied');}}));const page=await context.newPage();await page.goto(origin+'/');await page.locator('#display-language').selectOption('en');await page.locator('#claim').fill('A typed question');assert(await page.locator('#claim').inputValue()==='A typed question','Storage failure blocks typing');await context.close();
 const report={kind:'independent-site-polish-browser-audit',paidAIcalls:0,newSemanticAssessments:0,checks,blockedStorageTyping:true,notes:['This checks UI, navigation, exports and saved local state; it is not a new semantic accuracy benchmark.','Audio presence and accessibility are tested here; actual playback and dictation have separate media tests.']};writeFileSync('artifacts/site-polish-2026-10-05.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const directory='artifacts/private/input-journeys-2026-10-05';mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});const cases=[];
const fixture=await browser.newPage({viewport:{width:1000,height:500}});await fixture.setContent('<p style="font:36px Arial">Eating pork is forbidden in Islam.</p>');await fixture.screenshot({path:directory+'/image.png'});await fixture.close();
const record=JSON.parse(readFileSync('tests/fixtures/companion-referral.json','utf8')).record;
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport});
  await context.addInitScript(()=>{
   Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})},configurable:true});
   class Recorder {state='inactive';mimeType='audio/webm';static isTypeSupported(){return true;}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob([new Uint8Array([0x1a,0x45,0xdf,0xa3,1,2,3,4])],{type:'audio/webm'})});this.onstop?.();}}
   window.MediaRecorder=Recorder;
  });
  const page=await context.newPage();const errors=[];let verifications=0,transcriptions=0,imageReads=0;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/verify',route=>{verifications++;return route.fulfill({json:record});});
  await page.route('**/api/transcribe',route=>{if(route.request().method()==='GET')return route.fulfill({json:{available:true}});transcriptions++;return route.fulfill({json:{transcript:'What do Hadith sources say about intentions?'}});});
  await page.route('**/api/image-input',route=>{if(route.request().method()==='GET')return route.fulfill({json:{available:true}});imageReads++;return route.fulfill({json:{status:'read',transcript:'Eating pork is forbidden in Islam.',claims:['Eating pork is forbidden in Islam.'],note:''}});});
  await page.goto('http://127.0.0.1:3100/');await page.locator('#display-language').selectOption('en');
  const presets=page.locator('.presets');await presets.getByRole('button',{name:'What does the Quran say about treating parents kindly?'}).click();
  if(await page.locator('#claim').inputValue()!=='What does the Quran say about treating parents kindly?'||verifications)throw new Error('STARTER_AUTOSUBMIT');
  for(const language of ['ar','en','bn','hi','ur','id','es','fr','de']){await page.locator('#display-language').selectOption(language);if(await presets.getByRole('button').count()!==3)throw new Error('STARTER_LANGUAGE');}
  await page.locator('#display-language').selectOption('en');await page.locator('#claim').fill(record.original_claim);await page.getByRole('button',{name:'Examine the evidence'}).click();await page.locator('.result-content').waitFor();
  const history=page.getByRole('region',{name:'Recent checks',exact:true});
  if(await page.evaluate(()=>localStorage.getItem('isnadlens-recent-main-v1'))!==null)throw new Error('AUTO_SAVE');
  await history.getByRole('button',{name:'Save this check on this device',exact:true}).click();await history.locator('summary').first().click();await history.getByRole('button',{name:'View saved receipt',exact:true}).count();
  const downloadPromise=page.waitForEvent('download');await history.getByRole('button',{name:'Download saved receipt',exact:true}).click();const download=await downloadPromise;await download.saveAs(`${directory}/saved-${viewport.width}.pdf`);if(readFileSync(`${directory}/saved-${viewport.width}.pdf`).subarray(0,5).toString()!=='%PDF-')throw new Error('RECEIPT_CHANGED');
  await history.getByRole('button',{name:'Clear saved checks',exact:true}).click();if(await page.evaluate(()=>localStorage.getItem('isnadlens-recent-main-v1'))!==null)throw new Error('CLEAR_FAILED');await history.getByRole('button',{name:'Save this check on this device',exact:true}).click();
  await page.reload();await page.locator('#display-language').selectOption('en');await history.locator('summary').first().click();await history.getByRole('button',{name:'Load question',exact:true}).click();if(await page.locator('#claim').inputValue()!==record.original_claim||verifications!==1)throw new Error('HISTORY_AUTO_RERUN');
  await history.getByRole('button',{name:'Delete',exact:true}).click();if((await page.evaluate(()=>JSON.parse(localStorage.getItem('isnadlens-recent-main-v1')).checks.length))!==0)throw new Error('DELETE_FAILED');
  await page.locator('.input-tabs').getByRole('button',{name:'Voice',exact:true}).click();const voice=page.getByRole('region',{name:'Voice input',exact:true});await voice.getByRole('button',{name:'Stop',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#claim').value==='What do Hadith sources say about intentions?');if(transcriptions!==1||verifications!==1)throw new Error('VOICE_AUTO_HANDOFF');await page.locator('#claim').fill('What do Hadith sources say about kindness to neighbours?');

  await page.locator('.input-tabs').getByRole('button',{name:'Image',exact:true}).click();const image=page.getByRole('region',{name:'Image input',exact:true});await image.getByLabel('Choose an image',{exact:true}).setInputFiles(directory+'/image.png');if(imageReads)throw new Error('AUTO_IMAGE_UPLOAD');await image.getByRole('button',{name:'Read image',exact:true}).click();await image.getByRole('textbox').fill('Is eating pork forbidden in Islam?');await image.getByRole('button',{name:'Use this claim',exact:true}).click();if(await page.locator('#claim').inputValue()!=='Is eating pork forbidden in Islam?'||verifications!==1)throw new Error('IMAGE_HANDOFF');
  await page.locator('#claim').fill(record.original_claim);await page.getByRole('button',{name:'Examine the evidence'}).click();await page.locator('.result-content').waitFor();await page.locator('#claim').fill('A new question');if(await page.locator('.result-content').count())throw new Error('STALE_RESULT_AFTER_EDIT');
  await page.goto('http://127.0.0.1:3100/pilgrimage');await page.locator('#display-language').selectOption('en');await page.locator('.presets').getByRole('button',{name:'What does the Quran say about Safa and Marwa?'}).click();if(await page.locator('#claim').inputValue()!=='What does the Quran say about Safa and Marwa?'||verifications!==2)throw new Error('PILGRIMAGE_STARTER');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow||errors.length)throw new Error('BROWSER_ERRORS');
  await page.screenshot({path:`${directory}/pilgrimage-${viewport.width}.png`,fullPage:true});cases.push({width:viewport.width,starterLanguages:9,manualSave:true,receiptDownload:true,reload:true,delete:true,clear:true,automaticVoiceHandoff:true,imageReviewedHandoff:true,noAutomaticVerification:true,overflow,errors});await context.close();
 }
 const context=await browser.newContext();await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('storage denied');}}));const page=await context.newPage();await page.goto('http://127.0.0.1:3100/');await page.locator('#display-language').selectOption('en');await page.getByText('Saving is unavailable or the saved data is invalid. Verification still works.',{exact:true}).waitFor();await page.locator('#claim').fill('A typed question');if(await page.locator('#claim').inputValue()!=='A typed question')throw new Error('STORAGE_BLOCKS_TYPING');await context.close();
 const report={kind:'mocked-browser-input-and-history-journeys',paidAIcalls:0,providerResponses:'mocked; preserved real verification record replayed',microphone:'simulated, not physical-device certification',storageFailureTyping:true,cases};writeFileSync(`${directory}/report.json`,JSON.stringify(report,null,2));writeFileSync('artifacts/input-journeys-2026-10-05.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const directory='artifacts/private/feature-window-2026-10-05';mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const results=[];
try {
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-05T11:00:00Z'));
    await page.goto('http://127.0.0.1:3100/pilgrimage');await page.locator('#display-language').selectOption('en');
    await page.getByRole('button',{name:'Sai · Safa & Marwah',exact:true}).click();
    await page.getByRole('button',{name:'Put this question in the evidence tool',exact:true}).click();
    if(!(await page.locator('#claim').inputValue()).includes('starting Sai at Safa'))throw new Error('JOURNEY_QUESTION_FAILED');
    await page.getByLabel('Pilgrimage',{exact:true}).selectOption('hajj');
    await page.getByText('These are learning topics, not a mandatory sequence',{exact:false}).waitFor();
    const complete=page.getByRole('button',{name:'Completed one',exact:true}).first();
    await complete.click();await complete.click();
    await page.getByText('Recorded: 2 / 7').waitFor();
    await page.reload();await page.locator('#display-language').selectOption('en');await page.getByText('Recorded: 2 / 7').waitFor();
    await page.getByRole('button',{name:'Undo',exact:true}).first().click();await page.getByText('Recorded: 1 / 7').waitFor();
    await page.screenshot({path:`${directory}/pilgrimage-${viewport.width}.png`,fullPage:true});
    const pilgrimageWidth=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    // Replay the preserved real off-topic response to test navigation without another paid call.
    const referral=JSON.parse(readFileSync('artifacts/private/companion-live-2026-10-05/P03.json','utf8'));
    await page.route('**/api/verify',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(referral)}));
    await page.locator('#claim').fill(referral.original_claim);
    await page.getByRole('button',{name:'Examine the evidence',exact:false}).click();
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Download evidence receipt',exact:true}).click();
    const download=await downloadPromise;await download.saveAs(`${directory}/receipt-${viewport.width}.pdf`);
    if(readFileSync(`${directory}/receipt-${viewport.width}.pdf`).subarray(0,5).toString()!=='%PDF-')throw new Error('RECEIPT_ORIGINAL_MISSING');
    await page.locator('.result-content a.primary-button').click();
    await page.waitForURL('http://127.0.0.1:3100/');
    await page.waitForFunction(claim=>document.querySelector('#claim')?.value===claim,referral.original_claim);
    await page.unroute('**/api/verify');
    await page.goto('http://127.0.0.1:3100/tools');await page.getByRole('button',{name:'English',exact:true}).click();
    await page.getByRole('button',{name:'Show times',exact:true}).click();await page.getByText('04:57',{exact:true}).waitFor();
    await page.getByTestId('next-prayer').getByText('01:33:00',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Convert date',exact:true}).click();await page.getByText('05-10-2026',{exact:true}).last().waitFor();
    await page.getByRole('button',{name:'Show month',exact:true}).click();await page.getByText('Large number: Gregorian day. Small number: Hijri day/month.').waitFor();
    await page.getByLabel('Choose a city').selectOption('london');
    await page.getByText('119.0°',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Show times',exact:true}).click();await page.getByText('Europe/London',{exact:true}).first().waitFor();
    await page.getByText('My locations saved on this device',{exact:true}).click();
    await page.getByLabel('Location name').fill('Office');await page.getByRole('button',{name:'Save current location',exact:true}).click();
    await page.reload();await page.getByRole('button',{name:'English',exact:true}).click();await page.getByText('My locations saved on this device',{exact:true}).click();
    await page.getByRole('button',{name:'Office',exact:true}).click();await page.getByText('119.0°',{exact:true}).waitFor();
    await page.screenshot({path:`${directory}/tools-${viewport.width}.png`,fullPage:true});
    const toolsWidth=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    results.push({viewport,journeyNavigation:true,evidenceDownload:true,nextPrayerCountdown:true,qiblaBearing:true,savedLocationResume:true,progressResumeUndo:true,referralTransfersOriginalWithoutAutoSubmit:true,prayer:true,conversion:true,month:true,pilgrimageWidth,toolsWidth,errors});
    await page.goto('http://127.0.0.1:3100/evaluation/latest');await page.getByRole('heading',{name:'96.7% benchmark success.',exact:true}).waitFor();
    if(await page.locator('article').count()!==30)throw new Error('BENCHMARK_CASES_MISSING');
    await context.close();
  }
} finally {await browser.close();}
writeFileSync(`${directory}/report.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
if(results.some(result=>result.errors.length||result.pilgrimageWidth.scroll>result.viewport.width||result.toolsWidth.scroll>result.viewport.width))process.exitCode=1;

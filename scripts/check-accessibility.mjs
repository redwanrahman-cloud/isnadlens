import AxeBuilder from '@axe-core/playwright';
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{for(const width of [1440,390])for(const language of ['en','ar'])for(const route of ['/','/pilgrimage','/tools']){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();await page.goto('http://127.0.0.1:3100'+route);await page.locator('#display-language').selectOption(language);
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 results.push({route,width,language,violations:scan.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:scan.passes.length});await context.close();
}}finally{await browser.close();}
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/accessibility-audit-2026-10-05.json',JSON.stringify({tool:'axe-core',scope:'Automated WCAG checks, not complete usability or meaning review',results},null,2));
console.log(JSON.stringify(results.map(r=>({...r,violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.length}))})),null,2));
if(results.some(r=>r.violations.length))process.exitCode=1;


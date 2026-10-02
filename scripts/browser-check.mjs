import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {mkdirSync} from 'node:fs';
const root=fileURLToPath(new URL('../', import.meta.url));
const port=process.env.EVENTOPS_TEST_PORT || '3002', base=`http://localhost:${port}`;
const dataDir=mkdtempSync(path.join(tmpdir(), 'eventops-browser-'));
const server=spawn(process.execPath,[root+'/node_modules/next/dist/bin/next','start','--port',port,'--hostname','0.0.0.0'],{cwd:root,env:{...process.env,COMETCHAT_APP_ID:'',COMETCHAT_REST_API_KEY:'',COMETCHAT_REGION:'',DATABASE_URL:'',LLM_API_KEY:'',EVENTOPS_ACCESS_CODE:'',APP_ORIGIN:base,EVENTOPS_DATA_DIR:dataDir}});
server.stderr.on('data',x=>process.stdout.write(x));let browser;
try{
 for(let n=0;n<100;n++){try{if((await fetch(base+'/api/state')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,headless:true,args:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? ['--no-sandbox','--disable-dev-shm-usage','--single-process','--use-gl=angle','--use-angle=swiftshader'] : []});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE_ERROR',e.message)});
 await page.route('**/*',r=>r.request().url().startsWith(base)||r.request().url().startsWith('data:')?r.continue():r.abort());
 await page.goto(base,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Enter command center'}).click();
 await page.getByRole('heading',{name:/Command center/}).waitFor({timeout:8000});
 let state=await(await page.request.get(base+'/api/state')).json();if(state.configured)throw Error('QA remote integration must be disabled');
 await page.request.post(base+'/api/simulation/reset',{data:{},headers:{Origin:base}});
 await page.getByRole('link',{name:'Simulation lab',exact:true}).click();await page.locator('select').selectOption('0');
 await page.locator('.scenario-card').filter({has:page.getByRole('heading',{name:'Registration failure',exact:true})}).getByRole('button',{name:'Run scenario'}).click();
 await page.getByText('3/3 reports sent').waitFor({timeout:20000});
 await page.getByRole('link',{name:'Command center',exact:true}).click();await page.getByText('Registration congestion',{exact:true}).waitFor();
 mkdirSync(root+'/docs/screenshots',{recursive:true});await page.screenshot({path:root+'/docs/screenshots/command-center.png',fullPage:true});
 await page.getByRole('link').filter({hasText:'Registration congestion'}).first().click();await page.getByRole('heading',{name:'Registration congestion',exact:true}).waitFor();
 await page.getByRole('button',{name:'Acknowledge',exact:true}).click();await page.locator('.action-item').filter({hasText:'Deploy two available'}).getByRole('button',{name:'Approve',exact:true}).click();
 await page.getByText('in progress',{exact:true}).waitFor();await page.getByRole('button',{name:'Resolve',exact:true}).click();await page.getByLabel('Resolution summary').fill('Backup scanner deployed and the queue cleared.');await page.getByLabel('Confirmed root cause').fill('Scanner 2 hardware failure');await page.getByRole('button',{name:'Confirm resolution'}).click();await page.getByRole('heading',{name:'After-action report',exact:true}).waitFor();
 state=await(await page.request.get(base+'/api/state')).json();if(state.incidents[0].status!=='RESOLVED'||state.staff.some(s=>s.availability==='ON INCIDENT'))throw Error('Resolution failed');
 await page.locator('.after-action').scrollIntoViewIfNeeded();await page.screenshot({path:root+'/docs/screenshots/resolution-report.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.goto(base+'/command');await page.getByRole('heading',{name:/Command center/}).waitFor();await page.screenshot({path:root+'/docs/screenshots/mobile-command.png',fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw Error('Mobile horizontal overflow');
 await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('link',{name:'Staff & assignments',exact:true}).click();await page.getByRole('heading',{name:'Staff & assignments',exact:true}).waitFor();
 await page.request.post(base+'/api/session',{data:{uid:'eventops-kabir'},headers:{Origin:base}});const denied=await page.request.post(base+'/api/simulation/reset',{data:{},headers:{Origin:base}});if(denied.status()!==403)throw Error('Role protection failed');
 const csrf=await page.request.post(base+'/api/simulation/reset',{data:{},headers:{Origin:'https://untrusted.example'}});if(csrf.status()!==403)throw Error('Origin protection failed');
 if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
 console.log('PASS: full local workflow; mobile navigation; no horizontal overflow; role protection; zero page errors. Remote CometChat writes disabled.');
}finally{if(browser)await browser.close();server.kill('SIGTERM');rmSync(dataDir,{recursive:true,force:true});}

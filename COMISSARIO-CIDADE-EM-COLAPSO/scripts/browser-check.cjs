const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const OUT='/workspace/comissario-qa';
const BASE='https://comissario.test/COMISSARIO-CIDADE-EM-COLAPSO/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.webp':'image/webp'};
(async()=>{
 await fs.mkdir(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report=[];
 try {
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
   const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:viewport.width<600,hasTouch:viewport.width<600,serviceWorkers:'block'});
   await context.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.origin!=='https://comissario.test')return route.abort();
    let relative=decodeURIComponent(u.pathname.replace('/COMISSARIO-CIDADE-EM-COLAPSO/',''));
    if(!relative||relative.endsWith('/'))relative+='index.html';
    const local=path.resolve(ROOT,relative);if(!local.startsWith(ROOT+path.sep))return route.abort();
    try{await route.fulfill({status:200,contentType:types[path.extname(local)]||'application/octet-stream',body:await fs.readFile(local)});}catch{return route.fulfill({status:404,body:'not found: '+relative});}
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});
   await page.goto(BASE);await page.getByRole('button',{name:/Iniciar campanha/}).waitFor();
   await page.screenshot({path:OUT+'/title-'+viewport.width+'.png',fullPage:true});
   await page.getByRole('button',{name:/Iniciar campanha/}).click();
   await page.locator('[data-choice="audit"]').click();
   await page.locator('.office-scene').waitFor();
   await page.screenshot({path:OUT+'/office-'+viewport.width+'.png',fullPage:true});
   await page.locator('[data-action="select-contact"][data-id="P04"]').first().click();
   await page.locator('[data-person="P04"][data-topic="agenda"]').click();
   await page.locator('.call-dialog').waitFor();
   await page.screenshot({path:OUT+'/phone-'+viewport.width+'.png',fullPage:true});
   await page.locator('[data-action="close-modal"]').first().click();
   await page.locator('.nav-item[data-screen="fleet"]').click();
   await page.locator('[data-action="purchase"][data-type="sedan"]').click();
   await page.locator('.nav-item[data-screen="staff"]').click();
   await page.locator('[data-action="hire"]').first().click();
   await page.locator('.nav-item[data-screen="map"]').click();
   await page.locator('.incident-row').first().click();
   await page.locator('[data-action="dispatch"]').first().click();
   for(let i=0;i<12&&await page.locator('[data-action="advance-time"]').count()>1;i++)await page.locator('.incident-dialog [data-action="advance-time"]').click();
   if(await page.locator('[data-action="resolve-incident"]').count())await page.locator('[data-action="resolve-incident"]').first().click();
   await page.locator('.nav-item[data-screen="precinct"]').click();
   await page.locator('[data-action="select-room"][data-room="garage"]').click();
   await page.locator('[data-action="place-room"][data-x="8"][data-y="4"]').click();
   await page.locator('.nav-item[data-screen="case"]').click();
   await page.locator('[data-action="case-task"]').first().click();
   await page.locator('[data-action="quick-save"]').click();
   await page.reload();await page.getByRole('button',{name:'Continuar gestão'}).click();
   await page.locator('.nav-item[data-screen="map"]').click();
   await page.screenshot({path:OUT+'/map-'+viewport.width+'.png',fullPage:true});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(overflow,false,'Overflow horizontal global');
   assert.deepEqual(errors,[],'Erros do navegador');
   report.push({viewport,errors,overflow,screenshots:4,result:'PASS'});
   await context.close();
  }
 } finally{await browser.close();}
 await fs.writeFile(OUT+'/browser-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const server=spawn('python3',['-m','http.server','3032','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
  let ready=false;
  for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:3032/catalog/')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
  assert.ok(ready);
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3032/catalog/');
  await page.locator('main[data-ready="true"]').waitFor();
  assert.ok((await page.locator('article').count())>0);
  for (const text of await page.locator('article').allTextContents()) assert.equal(/RM\s*\d/.test(text),false,'held product descriptions do not advertise prices');
  await page.getByLabel('Cari produk').fill('no-such-product');
  await page.getByText(/Tiada produk sepadan/).waitFor();
  await page.getByLabel('Cari produk').fill('unifi');
  await page.getByLabel('Saluran').selectOption('hero');
  assert.equal(await page.getByRole('button',{name:/Mohon/}).count(),0);
  await page.goto('http://127.0.0.1:3032/boz/');
  await page.getByRole('button',{name:'Log masuk BOZ',exact:true}).waitFor();
  assert.equal(await page.locator('tbody tr').count(),0);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:3032/catalog/');
  await page.locator('main[data-ready="true"]').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: static catalogue, search, HERO hold, private master login and mobile layout.');
} finally {await browser?.close();server.kill();}

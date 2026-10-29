let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require(require('node:path').join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const { chromium } = playwright;
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const server = require('node:http').createServer((req,res)=>{ const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname); const file = path.join(__dirname,'..',name==='/'?'index.html':name); try { const content=fs.readFileSync(file); const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(content); } catch(e){res.statusCode=404;res.end('Not found');} });
(async () => {
 await new Promise(resolve=>server.listen(5503,'127.0.0.1',resolve));
 const browser = await chromium.launch({headless:true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
 try {
 const context = await browser.newContext();
 const page = await context.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5503'); await page.waitForLoadState('networkidle');
 await page.locator('#modeBtnReading').click();
 assert.equal(await page.locator('[data-lesson]').count(),10);
 const data = await page.evaluate(()=>window.READING_DATA);
 for(const l of data){
   await page.locator(`[data-lesson="${l.id}"]`).click();
   assert.equal(await page.locator('.reading-prose p').count(),l.text.split('\n').length);
   await page.locator('#readingCheck').click();
   assert.match(await page.locator('#readingResult').innerText(),/tất cả/);
   for(let i=0;i<l.questions.length;i++) await page.locator(`input[name="reading-q-${i}"][value="${l.questions[i].answer}"]`).check();
   await page.locator('#readingCheck').click();
   assert.match(await page.locator('#readingResult').innerText(),/2\/2/);
 }
 await page.locator('[data-lesson="first-job"]').click();
 await page.locator('.reading-word').first().click();
 await page.locator('[data-review-word]').click();
 assert.equal(await page.locator('[data-review-word]').isDisabled(),true);
 await page.locator('#readingFilter').selectOption('review');
 assert.ok(await page.locator('[data-lesson]').count()>0);
 await page.locator('#readingFilter').selectOption('all');
 await page.locator('#readingRuby').click();
 assert.ok(await page.locator('.reading-prose rt:visible').count()>0);
 const gd = page.locator('.reading-detail').nth(1); await gd.locator('summary').first().click();
 await page.locator('[data-grammar]').first().click();
 assert.match(await page.locator('[data-grammar]').first().innerText(),/Đã đánh dấu/);
 await page.reload(); await page.waitForLoadState('networkidle');
 assert.equal(await page.locator('#readingAppSection').isVisible(),true);
 assert.match(await page.locator('#readingProgress').innerText(),/10\/10/);
 await page.locator('#modeBtnVocab').click(); assert.equal(await page.locator('#vocabAppSection').isVisible(),true);
 await page.locator('#modeBtnGrammar').click(); assert.equal(await page.locator('#grammarAppSection').isVisible(),true);
 await page.locator('#modeBtnReading').click();
 await page.locator('#themeToggleBtn').click();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.locator('#themeToggleBtn').click();
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'tests/reading-mobile.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'tests/reading-desktop.png',fullPage:true});
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await context.setOffline(true); await page.reload();
 await page.locator('#readingArticle h2').waitFor();
 assert.equal(await page.locator('[data-lesson]').count(),10);
 assert.deepEqual(errors,[]);
 console.log('PASS: 10 articles, 20 correct answers, incomplete form, word review, grammar bookmark, filter, ruby, persistence, mode switching, mobile overflow, offline reload.');
 } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close(); process.exit(1)});

// Uses the same bundled Playwright/Edge setup as tests/reading.cjs.
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require(require('node:path').join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const server = require('node:http').createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    res.setHeader('Content-Type', {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json'}[path.extname(filename)] || 'application/octet-stream');
    res.end(fs.readFileSync(filename));
  } catch (_) { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(5505, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await playwright.chromium.launch({headless:true, channel:'msedge'});
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = 'http://127.0.0.1:5505/kanji-preview.html';
    let requests = 0;
    page.on('request', r => { if(r.url().endsWith('/strokes.json')) requests++; });
    await page.goto(url); await page.waitForLoadState('networkidle');
    const panel = page.locator('.kanji-writer');
    await page.waitForFunction(() => document.querySelectorAll('.kw-stroke[style*="visible"]').length >= 2);
    assert.equal(await page.locator('.kw-replay').count(), 1);
    assert.equal(await page.locator('.kw-board button').count(), 1, 'Only replay belongs in the drawing frame');
    assert.equal(await page.locator('.kw-stroke').count(), 8);
    assert.equal(await page.locator('.kw-number').count(), 8);
    assert.ok(await page.locator('.kw-stroke').evaluateAll(nodes => new Set(nodes.map(n=>n.getAttribute('stroke'))).size > 1));
    await page.locator('.kw-replay').click();
    assert.equal(await panel.getAttribute('data-state'), 'playing');
    assert.equal(await page.locator('.kw-stroke').evaluateAll(nodes=>nodes.filter(n=>n.style.visibility==='visible').length), 1);
    await page.locator('.kw-replay').click(); // Cancels the previous animation without an unhandled rejection.
    await page.waitForFunction(() => document.querySelector('.kanji-writer').dataset.state === 'complete');
    assert.ok(await page.locator('.kw-stroke').evaluateAll(nodes=>nodes.every(n=>n.style.visibility==='visible' && n.style.strokeDashoffset==='0')));
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:'tests/kanji-writer-mobile.png',fullPage:true});
    await page.locator('.kw-replay').focus(); await page.keyboard.press('Enter');
    assert.equal(await panel.getAttribute('data-state'), 'playing');
    await page.locator('#previewWord').fill('準備'); await page.getByRole('button',{name:'Xem',exact:true}).click();
    assert.equal(await page.locator('.kw-character').count(),2);
    await page.getByRole('button',{name:'Xem cách viết chữ 備',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Xem cách viết chữ 備',exact:true}).getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('.kw-canvas').getAttribute('aria-label'),/備/);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.querySelector('.kanji-writer').dataset.state==='complete');
    await page.evaluate(()=>writer.setWord('感じる'));
    assert.equal(await page.locator('.kw-character').count(),1);
    assert.equal(await page.locator('.kw-character').innerText(),'感');
    await page.evaluate(()=>writer.setWord('様々'));
    assert.equal(await page.locator('.kw-character').count(),1);
    await page.evaluate(()=>writer.setWord('カメラ・いろいろ々'));
    assert.equal(await panel.getAttribute('data-state'),'unavailable');
    assert.equal(await page.locator('.kw-character').count(),0);
    assert.ok(await page.locator('.kw-replay').isDisabled());
    await page.evaluate(()=>writer.setWord('龍'));
    assert.match(await page.locator('.kw-message').innerText(),/Chưa có dữ liệu/);
    assert.equal(await page.locator('.kw-stroke').count(),0);
    await page.evaluate(async()=>{await writer.setWord('<img src=x onerror=alert(1)>準');});
    assert.equal(await panel.locator('img').count(),0);
    assert.equal(await page.locator('.kw-character').innerText(),'準');
    assert.equal(requests,1,'Switching/replaying should reuse loaded data');
    await page.evaluate(()=>writer.setWord('刻'));
    await page.evaluate(()=>document.documentElement.dataset.theme='dark');
    await page.screenshot({path:'tests/kanji-writer-dark.png',fullPage:true});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(()=>writer.destroy());
    assert.equal(await panel.count(),0);

    // Network failure/retry uses the same replay control; no separate action button.
    const retry = await browser.newPage();
    retry.on('pageerror',error=>errors.push(error.message));
    let fail = true;
    await retry.route('**/strokes.json',route=>fail?route.abort():route.continue());
    await retry.goto(url); await retry.waitForLoadState('networkidle');
    assert.equal(await retry.locator('.kanji-writer').getAttribute('data-state'),'error');
    fail = false;
    await retry.locator('.kw-replay').click();
    await retry.waitForFunction(()=>document.querySelector('.kanji-writer').dataset.state==='playing');
    // Switching while still loading must not restore the old word when the fetch resolves.
    await retry.reload();
    await retry.evaluate(async()=>{await writer.setWord('カメラ');});
    assert.equal(await retry.locator('.kw-character').count(),0);
    assert.equal(await retry.locator('.kanji-writer').getAttribute('data-state'),'unavailable');

    // Application integration: the same dialog works in flashcards and the reading lookup.
    const appContext = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const app = await appContext.newPage();
    app.on('pageerror',error=>errors.push(error.message));
    await app.goto('http://127.0.0.1:5505/index.html'); await app.waitForLoadState('networkidle');
    await app.locator('[data-tab="flashcard"]').click();
    const word = await app.locator('#fcKanji').innerText();
    const beforeFlip = await app.locator('#flashcardElement').getAttribute('class');
    await app.locator('#fcWritingBtn').click();
    await app.locator('#kanjiDialog .kw-character').first().waitFor();
    assert.ok(await app.locator('#kanjiDialog').evaluate(d=>d.open));
    await app.keyboard.press('ArrowRight'); await app.keyboard.press('Space');
    assert.equal(await app.locator('#fcKanji').innerText(),word,'Dialog keys must not change flashcards');
    assert.equal(await app.locator('#flashcardElement').getAttribute('class'),beforeFlip);
    await app.keyboard.press('Escape');
    await app.waitForFunction(()=>!document.querySelector('#kanjiDialog').open);
    assert.ok(await app.locator('#fcWritingBtn').evaluate(b=>b===document.activeElement));
    await app.locator('#fcNextBtn').click();
    await app.locator('#fcWritingBtn').click();
    assert.equal(await app.locator('#kanjiDialog .kw-word').innerText(),await app.locator('#fcKanji').innerText());
    await app.getByRole('button',{name:'Đóng hướng dẫn viết'}).click();
    await app.locator('#modeBtnReading').click();
    await app.locator('#readingStage').selectOption('1');
    await app.locator('[data-lesson="s1-office"]').click();
    await app.getByRole('button',{name:'Tra từ オフィス',exact:true}).click();
    assert.equal(await app.locator('#readingLookup [data-kanji-word]').count(),0);
    await app.getByRole('button',{name:'Tra từ 名刺',exact:true}).click();
    const saved = await app.evaluate(()=>localStorage.getItem('jlpt_n3_reading'));
    await app.locator('#readingLookup [data-kanji-word]').click();
    assert.equal(await app.locator('#kanjiDialog .kw-character').count(),2);
    await app.getByRole('button',{name:'Xem cách viết chữ 刺',exact:true}).click();
    assert.match(await app.locator('#kanjiDialog .kw-canvas').getAttribute('aria-label'),/刺/);
    assert.ok(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const bounds=await app.locator('#kanjiDialog').boundingBox();
    assert.ok(bounds.x>=0 && bounds.y>=0 && bounds.x+bounds.width<=390 && bounds.y+bounds.height<=844,'Dialog fits the viewport');
    await app.screenshot({path:'tests/kanji-reading-mobile.png'});
    await app.getByRole('button',{name:'Đóng hướng dẫn viết'}).click();
    assert.equal(await app.locator('#kanjiDialog .kanji-writer').count(),0,'Closing destroys the writer');
    assert.equal(await app.evaluate(()=>localStorage.getItem('jlpt_n3_reading')),saved,'Viewing strokes must not change reading progress');
    await app.evaluate(async()=>{
      await Promise.race([navigator.serviceWorker.ready, new Promise((_,reject)=>setTimeout(()=>reject(new Error('Service worker not ready')),15000))]);
      const cache=await caches.open('quiz-n3-mimikara-v16');
      if(!await cache.match('./data/kanji/strokes.json')) throw new Error('Stroke data not precached');
    });
    await appContext.setOffline(true); await app.reload();
    await app.locator('#modeBtnReading').click();
    await app.getByRole('button',{name:'Tra từ 名刺',exact:true}).click();
    await app.locator('#readingLookup [data-kanji-word]').click();
    await app.waitForFunction(()=>document.querySelector('#kanjiDialog .kanji-writer')?.dataset.state==='complete');
    assert.equal(await app.locator('#kanjiDialog .kw-character').count(),2);
    await appContext.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: stroke order animation, replay cancellation, keyboard replay, kanji selection, kana exclusion, missing data, safe text, cache reuse, retry, reduced motion, mobile/dark, destroy.');
  } finally { if(browser) await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
